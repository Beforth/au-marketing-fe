# AI Dashboard and Report Generator Restoration Code Blocks

This document contains the exact code snippets and locations of the AI widget and report template generation features that have been commented out. Use this file to restore the AI natural language generation functionality when needed.

---

## 1. Backend Route & Schemas (`au-marketing-api/app/routers/saved_dashboards.py`)

### Schemas (around line 92)
```python
class AISchemaColumn(BaseModel):
    name: str
    type: str


class AISchemaTable(BaseModel):
    name: str
    columns: List[AISchemaColumn] = Field(default_factory=list)


class AIWidgetGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=5, max_length=4000)
    schema: List[AISchemaTable] = Field(default_factory=list)
    scope_mode: str = Field(default="auto", description="auto|employee|region|domain")
    preferred_chart: Optional[str] = Field(default=None, description="table|bar|line|pie|heatmap|number-card")
    date_from: Optional[str] = Field(default=None, description="YYYY-MM-DD")
    date_to: Optional[str] = Field(default=None, description="YYYY-MM-DD")


class AIWidgetGenerateResponse(BaseModel):
    title: str
    chart_type: str
    sql: str
```

### Route `/ai-generate-widget` (around line 572)
```python
@router.post("/ai-generate-widget", response_model=AIWidgetGenerateResponse)
async def ai_generate_widget(
    body: AIWidgetGenerateRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("marketing.view_lead")),
):
    """
    Generate scoped SQL + chart type for a dashboard widget using Groq.
    SQL is returned as a template with placeholders (e.g. {{employee_id}}) and
    is executed only server-side when loading the saved dashboard.
    """
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI widget generator is not configured. Set GROQ_API_KEY on backend.",
        )

    scope_mode = (body.scope_mode or "auto").strip().lower()
    if scope_mode not in {"auto", "employee", "region", "domain"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="scope_mode must be auto|employee|region|domain")

    preferred_chart = (body.preferred_chart or "").strip().lower()
    chart_hint = preferred_chart if preferred_chart in ALLOWED_CHART_TYPES else "auto"
    parsed_date_from, parsed_date_to = _normalize_date_range(body.date_from, body.date_to)

    schema_lines: List[str] = []
    for table in body.schema[:80]:
        cols = ", ".join(f"{c.name}:{c.type}" for c in table.columns[:80])
        schema_lines.append(f"- {table.name}({cols})")
    schema_text = "\n".join(schema_lines) if schema_lines else "- (schema not provided)"

    scope_rule = {
        "employee": "SQL MUST include {{employee_id}} in WHERE clause.",
        "region": "SQL MUST include {{region_id}} (or {{region_ids}} with IN).",
        "domain": "SQL MUST include {{domain_id}} in WHERE clause.",
        "auto": "SQL MUST include at least one of {{employee_id}}, {{region_id}}, {{region_ids}}, {{domain_id}}.",
    }[scope_mode]

    system_prompt = (
        "You are a senior analytics SQL assistant for PostgreSQL.\n"
        "Return ONLY JSON object with keys: title, chart_type, sql.\n"
        "Rules:\n"
        "- SQL must be a SINGLE SELECT statement.\n"
        "- Never use INSERT/UPDATE/DELETE/CREATE/ALTER/DROP/TRUNCATE.\n"
        "- Use only tables/columns from provided schema.\n"
        f"- {scope_rule}\n"
        "- Prefer LIMIT 500 unless aggregation naturally returns few rows.\n"
        "- chart_type must be one of: table, bar, line, pie, heatmap, number-card.\n"
        "- Keep title concise.\n"
        "- If the report is date/time based, include placeholders {{date_from}} and {{date_to}} in WHERE filter."
    )
    selected_date_text = (
        f"{parsed_date_from.isoformat() if parsed_date_from else 'not set'} to {parsed_date_to.isoformat() if parsed_date_to else 'not set'}"
    )
    user_prompt = (
        f"User request: {body.prompt}\n"
        f"Preferred chart: {chart_hint}\n"
        f"Selected dashboard date range: {selected_date_text}\n"
        "Available date placeholders: {{date_from}}, {{date_to}}.\n"
        "Available schema:\n"
        f"{schema_text}\n"
    )

    payload = {
        "model": settings.GROQ_MODEL,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            models_to_try = [settings.GROQ_MODEL, "llama-3.3-70b-versatile"]
            resp = None
            last_error = ""
            for model in models_to_try:
                payload["model"] = model
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                if resp.status_code < 400:
                    break
                last_error = resp.text[:300]
            if resp is None or resp.status_code >= 400:
                raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Groq API error: {last_error}")

        content = (((resp.json() or {}).get("choices") or [{}])[0].get("message") or {}).get("content")
        if not content:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Groq returned empty response")
        content = content.strip()
        if content.startswith("```"):
            content = re.sub(r"^```(?:json)?\s*", "", content, flags=re.IGNORECASE).strip()
            content = re.sub(r"\s*```$", "", content).strip()
        parsed = json.loads(content)
    except HTTPException:
        raise
    except Exception as ex:
        logger.exception("AI widget generation failed")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"AI generation failed: {ex}")

    title = str((parsed or {}).get("title") or "").strip() or "AI Widget"
    chart_type = str((parsed or {}).get("chart_type") or "table").strip().lower()
    sql = str((parsed or {}).get("sql") or "").strip()
    if chart_type not in ALLOWED_CHART_TYPES:
        chart_type = "table"
    if not sql:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="AI did not return SQL")
    if not _validate_sql(sql):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="AI returned non-SELECT or unsafe SQL")
    _validate_sql_template_against_schema(sql, body.schema)
    _validate_sql_template_scope(sql, scope_mode)

    # Compile once with current user context to ensure placeholders are valid and executable structure is sane.
    compiled_sql = _compile_sql_template(
        sql,
        _scope_context(
            db,
            user,
            date_from=parsed_date_from.isoformat() if parsed_date_from else None,
            date_to=parsed_date_to.isoformat() if parsed_date_to else None,
        ),
    )
    if not _validate_sql(compiled_sql):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Generated SQL template failed validation after scope compilation")

    return AIWidgetGenerateResponse(title=title, chart_type=chart_type, sql=sql)
```

---

## 2. Frontend API Helper (`lib/marketing-api.ts`)

```typescript
  async generateWidgetWithAI(data: {
    prompt: string;
    schema: { name: string; columns: { name: string; type: string }[] }[];
    scope_mode?: 'auto' | 'employee' | 'region' | 'domain';
    preferred_chart?: 'table' | 'bar' | 'line' | 'pie' | 'heatmap' | 'number-card';
    date_from?: string;
    date_to?: string;
  }): Promise<{ title: string; chart_type: 'table' | 'bar' | 'line' | 'pie' | 'heatmap' | 'number-card'; sql: string }> {
    return apiClient.post<{ title: string; chart_type: 'table' | 'bar' | 'line' | 'pie' | 'heatmap' | 'number-card'; sql: string }>(
      '/api/saved-dashboards/ai-generate-widget',
      data
    );
  }
```

---

## 3. Frontend Dashboard Page (`pages/DashboardPage.tsx`)

### State variables (around line 361)
```typescript
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiScopeMode, setAiScopeMode] = useState<'auto' | 'employee' | 'region' | 'domain'>('auto');
  const [aiGenerating, setAiGenerating] = useState(false);
```

### Event handler (around line 655)
```typescript
  const handleGenerateWidgetWithAI = async () => {
    if (!aiPrompt.trim()) {
      showToast('Enter report context for AI generation', 'error');
      return;
    }
    setAiGenerating(true);
    try {
      const schema = await marketingAPI.getSchema();
      const ai = await marketingAPI.generateWidgetWithAI({
        prompt: aiPrompt.trim(),
        date_from: dashboardDateFrom || undefined,
        date_to: dashboardDateTo || undefined,
        schema: (schema.tables || []).map((t) => ({
          name: t.name,
          columns: (t.columns || []).map((c) => ({ name: c.name, type: c.type })),
        })),
        scope_mode: aiScopeMode,
        preferred_chart: addWidgetType === 'custom_sql' ? (addWidgetChartType as 'table' | 'bar' | 'line' | 'pie' | 'number-card') : undefined,
      });
      setAddWidgetType('custom_sql');
      setAddWidgetTitle(ai.title || addWidgetTitle);
      setAddWidgetCode(ai.sql || '');
      setAddWidgetChartType(ai.chart_type || 'table');
      await runSqlPreview(ai.sql || '', ai.chart_type || 'table');
      showToast('AI generated widget SQL. Review and add.');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to generate widget with AI', 'error');
    } finally {
      setAiGenerating(false);
    }
  };
```

### Add Widget Modal UI card (around line 2050)
```tsx
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <Wand2 size={14} />
                    <p className="text-xs font-semibold">AI widget generator</p>
                  </div>
                  <textarea
                    className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe the report you need. Example: show monthly quotations by region for my scope."
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Select
                      label="Scope mode"
                      value={aiScopeMode}
                      onChange={(v) => setAiScopeMode((v ?? 'auto') as 'auto' | 'employee' | 'region' | 'domain')}
                      options={AI_SCOPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                      searchable={false}
                    />
                    <div className="flex items-end">
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        leftIcon={<Wand2 size={14} />}
                        disabled={aiGenerating || !aiPrompt.trim()}
                        onClick={handleGenerateWidgetWithAI}
                      >
                        {aiGenerating ? 'Generating...' : 'Generate with AI'}
                      </Button>
                    </div>
                  </div>
                </div>
```

---

## 4. Frontend Report Templates Page (`pages/ReportTemplatesPage.tsx`)

### State variables (around line 78)
```typescript
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiScopeMode, setAiScopeMode] = useState<'auto' | 'employee' | 'region' | 'domain'>('auto');
```

### Event handler (around line 355)
```typescript
  const handleGenerateSectionWithAI = async () => {
    if (!aiPrompt.trim()) {
      showToast('Describe the report section for AI generation', 'error');
      return;
    }
    setAiGenerating(true);
    try {
      const schema = await marketingAPI.getSchema();
      const ai = await marketingAPI.generateWidgetWithAI({
        prompt: aiPrompt.trim(),
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        schema: (schema.tables || []).map((t) => ({
          name: t.name,
          columns: (t.columns || []).map((c) => ({ name: c.name, type: c.type })),
        })),
        scope_mode: aiScopeMode,
        preferred_chart: 'table',
      });
      setSectionTitle(ai.title || sectionTitle);
      setSectionSql(ai.sql || sectionSql);
      showToast('AI generated SQL. Review and add section.');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to generate with AI', 'error');
    } finally {
      setAiGenerating(false);
    }
  };
```

### Add Section Modal UI card (around line 705)
```tsx
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800">
                <Wand2 size={14} />
                <p className="text-xs font-semibold">AI section generator</p>
              </div>
              <textarea
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe the report section you need. Example: list leads by status with count for my scope this month."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Select
                  label="Scope mode"
                  value={aiScopeMode}
                  onChange={(v) => setAiScopeMode((v ?? 'auto') as 'auto' | 'employee' | 'region' | 'domain')}
                  options={AI_SCOPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  searchable={false}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    leftIcon={<Wand2 size={14} />}
                    disabled={aiGenerating || !aiPrompt.trim()}
                    onClick={handleGenerateSectionWithAI}
                  >
                    {aiGenerating ? 'Generating...' : 'Generate with AI'}
                  </Button>
                </div>
              </div>
            </div>
```
