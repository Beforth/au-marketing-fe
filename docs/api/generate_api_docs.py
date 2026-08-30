#!/usr/bin/env python3
"""
Generate the human- and AI-readable API reference under docs/api/.

Source of truth
---------------
- docs/api/openapi.json  — a snapshot of the live Marketing API's OpenAPI schema
  (paths, methods, parameters, request/response models). Refresh it with:

      curl -s http://localhost:8003/openapi.json -o docs/api/openapi.json

- au-marketing-api/app/routers/*.py — parsed only to recover the RBAC permission
  string(s) each endpoint requires (`require_permission(...)`), which FastAPI does
  not put in the OpenAPI schema.

Then run:

    python3 docs/api/generate_api_docs.py

Output: one Markdown file per resource group (tag) plus README.md, all in docs/api/.
Everything in docs/api/ except this script and openapi.json is generated — do not
hand-edit it; change this script instead.
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
OPENAPI = HERE / "openapi.json"
ROUTERS = REPO / "au-marketing-api" / "app" / "routers"

# ---------------------------------------------------------------------------
# 1. Load OpenAPI
# ---------------------------------------------------------------------------
spec = json.loads(OPENAPI.read_text())
SCHEMAS = spec.get("components", {}).get("schemas", {})
API_VERSION = spec.get("info", {}).get("version", "unknown")

HTTP_METHODS = ("get", "post", "put", "patch", "delete")


# ---------------------------------------------------------------------------
# 2. Recover the permission required by each endpoint from the router source
# ---------------------------------------------------------------------------
route_re = re.compile(r"""@router\.(get|post|put|patch|delete)\(\s*["']([^"']*)["']""")
perm_re = re.compile(r"""require_permission\(\s*["']([^"']+)["']""")
any_perm_re = re.compile(r"""require_any_permission\(\s*\[([^\]]+)\]""", re.DOTALL)
all_perm_re = re.compile(r"""require_all_permissions\(\s*\[([^\]]+)\]""", re.DOTALL)
prefix_re = re.compile(r"""APIRouter\([^)]*prefix\s*=\s*["']([^"']+)["']""")
mount_re = re.compile(r"""include_router\(\s*(\w+)\.router,\s*prefix\s*=\s*["']([^"']+)["']""")

MAIN_PY = (REPO / "au-marketing-api" / "app" / "main.py").read_text()
# name-as-used-in-main -> mount prefix
mounts = {name: prefix for name, prefix in mount_re.findall(MAIN_PY)}


def mount_for(stem: str) -> str:
    for cand in (stem, f"{stem}_router", f"{stem.rstrip('s')}_router"):
        if cand in mounts:
            return mounts[cand]
    return "/api"


def norm(p: str) -> str:
    return "/" + p.strip("/")


def _split_perms(blob: str) -> list[str]:
    return re.findall(r"""["']([^"']+)["']""", blob)


# (METHOD, normalized full path) -> {"perms": [...], "any": bool}
perm_index: dict[tuple[str, str], dict] = {}

for pyfile in sorted(ROUTERS.glob("*.py")):
    if pyfile.name == "__init__.py":
        continue
    text = pyfile.read_text()
    mp = prefix_re.search(text)
    internal_prefix = mp.group(1) if mp else ""
    base = mount_for(pyfile.stem) + internal_prefix

    # split source into per-route chunks so a require_permission can't leak
    # from one handler into the next
    chunks = re.split(r"(?=@router\.(?:get|post|put|patch|delete)\()", text)
    for chunk in chunks:
        rm = route_re.search(chunk)
        if not rm:
            continue
        method = rm.group(1).upper()
        full = norm(base + rm.group(2))
        entry = {"perms": [], "any": False}
        entry["perms"] += perm_re.findall(chunk)
        for blob in any_perm_re.findall(chunk):
            entry["perms"] += _split_perms(blob)
            entry["any"] = True
        for blob in all_perm_re.findall(chunk):
            entry["perms"] += _split_perms(blob)
        perm_index[(method, full)] = entry


def lookup_permission(method: str, path: str) -> str:
    entry = perm_index.get((method.upper(), norm(path)))
    if not entry or not entry["perms"]:
        return "_no explicit check — public or token-only_"
    perms = sorted(set(entry["perms"]))
    joiner = " **or** " if entry["any"] else " **and** "
    return joiner.join(f"`{p}`" for p in perms)


# ---------------------------------------------------------------------------
# 3. Turn a JSON Schema into a compact example value
# ---------------------------------------------------------------------------
def resolve_ref(node: dict) -> dict:
    if "$ref" in node:
        name = node["$ref"].split("/")[-1]
        return SCHEMAS.get(name, {})
    return node


def pick_variant(node: dict) -> dict:
    """Collapse anyOf/allOf/oneOf (Pydantic Optional[...]) to the meaningful branch."""
    for key in ("anyOf", "oneOf", "allOf"):
        if key in node:
            variants = [v for v in node[key] if v.get("type") != "null"]
            if variants:
                merged = dict(variants[0])
                # carry siblings like "title"/"description"
                for k, v in node.items():
                    if k not in (key,):
                        merged.setdefault(k, v)
                return merged
            return {"type": "null"}
    return node


MAX_DEPTH = 4


def example_for(schema: dict, name: str = "", _seen: frozenset = frozenset(),
                depth: int = 0) -> object:
    schema = pick_variant(resolve_ref(pick_variant(schema)))

    if "example" in schema:
        return schema["example"]
    if "default" in schema and schema["default"] is not None:
        return schema["default"]
    if "enum" in schema and schema["enum"]:
        return schema["enum"][0]

    t = schema.get("type")

    if t == "object" or "properties" in schema:
        title = schema.get("title", "")
        if title and title in _seen:
            return {}
        if depth >= MAX_DEPTH and schema.get("properties"):
            return f"{{ … {title or 'object'} }}"
        seen2 = _seen | ({title} if title else set())
        out = {}
        for prop, psub in schema.get("properties", {}).items():
            out[prop] = example_for(psub, prop, seen2, depth + 1)
        if not out and schema.get("additionalProperties"):
            return {"key": "value"}
        return out

    if t == "array":
        if depth >= MAX_DEPTH:
            return []
        item = example_for(schema.get("items", {}), name, _seen, depth + 1)
        return [item]

    if t == "integer":
        return _int_hint(name)
    if t == "number":
        return _num_hint(name)
    if t == "boolean":
        return False
    if t == "null":
        return None

    # string (and unknowns)
    return _str_hint(name)


def _int_hint(name: str) -> int:
    n = name.lower()
    if n.endswith("_id") or n == "id":
        return 1
    if "page" in n:
        return 1
    if "count" in n or "size" in n:
        return 20
    if "days" in n:
        return 2
    return 0


def _num_hint(name: str) -> float:
    n = name.lower()
    if any(w in n for w in ("amount", "cost", "value", "budget", "price", "target")):
        return 100000
    if "percent" in n or "rate" in n:
        return 0
    return 0


def _str_hint(name: str) -> str:
    n = name.lower()
    if n in ("start_date", "end_date", "date", "due_date", "won_date", "expected_date"):
        return "2026-01-31"
    if "datetime" in n or n.endswith("_at"):
        return "2026-01-31T09:30:00Z"
    if "email" in n:
        return "person@example.com"
    if "phone" in n or "mobile" in n:
        return "+91 90000 00000"
    if "url" in n or "link" in n or "website" in n:
        return "https://example.com"
    if "name" in n:
        return "Example name"
    if "status" in n:
        return "active"
    if "note" in n or "description" in n or "remark" in n or "comment" in n:
        return "Free-text notes"
    if "search" in n or "query" in n or n == "q":
        return "acme"
    return "string"


# ---------------------------------------------------------------------------
# 4. Build docs
# ---------------------------------------------------------------------------
def slug(tag: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", tag.lower()).strip("-")


def pretty_model(name: str) -> str:
    """PaginatedResponse_EventResponse_ -> PaginatedResponse<EventResponse>."""
    m = re.match(r"^(\w+?)_(\w+?)_+$", name)
    if m:
        return f"{m.group(1)}<{m.group(2)}>"
    return name


def body_schema_name(op: dict) -> str | None:
    try:
        content = op["requestBody"]["content"]
        for ct in ("application/json", "application/x-www-form-urlencoded", "multipart/form-data"):
            if ct in content:
                node = content[ct]["schema"]
                if "$ref" in node:
                    return node["$ref"].split("/")[-1]
                return ct  # inline schema (e.g. file upload form)
    except (KeyError, TypeError):
        return None
    return None


def success_response(op: dict) -> tuple[str, str | None, object]:
    responses = op.get("responses", {})
    for code in ("200", "201", "202", "204"):
        if code in responses:
            r = responses[code]
            if code == "204":
                return code, None, None
            try:
                node = r["content"]["application/json"]["schema"]
            except (KeyError, TypeError):
                return code, None, None
            ref = node["$ref"].split("/")[-1] if "$ref" in node else None
            return code, ref, example_for(node)
    return (next(iter(responses), "200"), None, None)


def params_table(params: list[dict], loc: str) -> str:
    rows = [p for p in params if p.get("in") == loc]
    if not rows:
        return "_none_"
    out = ["| name | type | required | description |", "|---|---|---|---|"]
    for p in rows:
        sch = pick_variant(p.get("schema", {}))
        typ = sch.get("type", "string")
        if typ == "array":
            typ = f"{pick_variant(sch.get('items', {})).get('type', 'string')}[]"
        default = sch.get("default")
        desc = p.get("description", "")
        if default is not None:
            desc = (desc + f" (default: `{default}`)").strip()
        rows_req = "yes" if p.get("required") else "no"
        out.append(f"| `{p['name']}` | {typ} | {rows_req} | {desc} |")
    return "\n".join(out)


def json_block(value: object) -> str:
    return "```json\n" + json.dumps(value, indent=2, ensure_ascii=False) + "\n```"


ops_by_tag: dict[str, list[tuple[str, str, dict]]] = defaultdict(list)
for path, methods in spec["paths"].items():
    for method, op in methods.items():
        if method not in HTTP_METHODS:
            continue
        tag = (op.get("tags") or ["Other"])[0]
        ops_by_tag[tag].append((method.upper(), path, op))

for tag in ops_by_tag:
    ops_by_tag[tag].sort(key=lambda t: (t[1], HTTP_METHODS.index(t[0].lower())))

GENERATED_NOTE = (
    "<!-- GENERATED FILE — do not edit by hand. "
    "Regenerate with `python3 docs/api/generate_api_docs.py`. -->\n"
)

total_ops = sum(len(v) for v in ops_by_tag.values())

# ---- per-tag files ----
for tag, ops in sorted(ops_by_tag.items()):
    lines = [GENERATED_NOTE, f"# {tag} API\n",
             f"{len(ops)} endpoint(s). Base URL: `${{VITE_API_BASE_URL}}` (dev: `http://localhost:8003`).\n",
             "Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) "
             "unless noted otherwise. Response shapes are in [Models](#models) at the bottom. "
             "See [README.md](./README.md) for conventions.\n",
             "---\n"]
    response_models: dict[str, dict] = {}  # name -> op schema node, deduped, in first-seen order
    for method, path, op in ops:
        summary = op.get("summary") or ""
        desc = (op.get("description") or "").strip()
        lines.append(f'<a id="{slug(method + " " + path)}"></a>')
        lines.append(f"## `{method} {path}`\n")
        if summary:
            lines.append(f"**{summary}**\n")
        if desc and desc != summary:
            lines.append(desc + "\n")
        lines.append(f"**Permission:** {lookup_permission(method, path)}\n")

        params = op.get("parameters", [])
        if any(p.get("in") == "path" for p in params):
            lines.append("**Path parameters:**\n")
            lines.append(params_table(params, "path") + "\n")
        else:
            lines.append("**Path parameters:** _none_\n")
        if any(p.get("in") == "query" for p in params):
            lines.append("**Query parameters:**\n")
            lines.append(params_table(params, "query") + "\n")

        bname = body_schema_name(op)
        if bname:
            if bname in SCHEMAS:
                lines.append(f"**Request body** (`{bname}`):\n")
                lines.append(json_block(example_for({"$ref": f"#/components/schemas/{bname}"})) + "\n")
            else:
                lines.append(f"**Request body:** `{bname}` (file upload / form fields — see parameters above)\n")

        code, rname, rexample = success_response(op)
        if code == "204":
            lines.append(f"**Response** `{code}` — _no body._\n")
        elif rname and rname in SCHEMAS:
            response_models.setdefault(rname, {"$ref": f"#/components/schemas/{rname}"})
            lines.append(f"**Response** `{code}` — [`{pretty_model(rname)}`](#{slug(rname)})\n")
        elif rexample is not None:
            lines.append(f"**Response** `{code}`:\n")
            lines.append(json_block(rexample) + "\n")
        else:
            lines.append(f"**Response** `{code}`\n")

        lines.append("---\n")

    if response_models:
        lines.append("## Models\n")
        lines.append("Example response bodies (synthetic — shapes, not real data; "
                     f"nesting capped at {MAX_DEPTH} levels).\n")
        for mname, node in response_models.items():
            lines.append(f'<a id="{slug(mname)}"></a>')
            lines.append(f"### {pretty_model(mname)}\n")
            lines.append(json_block(example_for(node)) + "\n")

    (HERE / f"{slug(tag)}.md").write_text("\n".join(lines))

# ---- index ----
idx = [GENERATED_NOTE, "# Marketing API reference\n",
       f"Auto-generated from the live OpenAPI schema (API version **{API_VERSION}**) — "
       f"**{total_ops} endpoints** across **{len(ops_by_tag)} resource groups**.\n",
       "## What this is\n",
       "A flat, example-first reference to every HTTP endpoint the Marketing API "
       "(FastAPI, default `:8003`) exposes. Written so a person *or* an AI assistant can "
       "pick an endpoint, see exactly what to send, and see exactly what comes back. "
       "The interactive Swagger UI at `http://localhost:8003/docs` is the same data in "
       "a different form.\n",
       "## Conventions\n",
       "- **Base URL** — `${VITE_API_BASE_URL}` from the frontend `.env` (dev default "
       "`http://localhost:8003`). Paths below already include the `/api` prefix.\n"
       "- **Auth** — obtain a JWT by logging in against **HRMS** (not this API), then send "
       "it on every call as `Authorization: Bearer <JWT>`. This API re-checks the "
       "permission for the route against HRMS on each request (short server-side cache).\n"
       "- **Permission** — the `marketing.*` RBAC code(s) the endpoint requires, recovered "
       "from the router source. `or` means any one suffices; `and` means all are needed; "
       "_no explicit check_ means the route has no `require_permission` (public, or only "
       "needs a valid token).\n"
       "- **Examples** — request/response bodies are **synthetic**, generated from the "
       "schema types (enums show their first allowed value, ids show `1`, money shows "
       "`100000`, nesting is capped at 4 levels). They show *shape*, not real data.\n"
       "- **Freshness** — this snapshot is API **v" + API_VERSION + "**. Anything shipped "
       "after that deploy (new fields, new endpoints) shows up only once someone refreshes "
       "`openapi.json` and regenerates.\n"
       "- **IDs** — `created_by_employee_id` columns actually hold the Django auth *user* "
       "id, not the HRMS employee id (a known historical quirk — see `CLAUDE.md`).\n",
       "## How to regenerate\n",
       "```bash\n"
       "curl -s http://localhost:8003/openapi.json -o docs/api/openapi.json\n"
       "python3 docs/api/generate_api_docs.py\n"
       "```\n"
       "Everything in `docs/api/` except `generate_api_docs.py` and `openapi.json` is "
       "generated. Edit the script, not the output.\n",
       "## Resource groups\n",
       "| Group | Endpoints | File |",
       "|---|---|---|"]
for tag, ops in sorted(ops_by_tag.items()):
    idx.append(f"| {tag} | {len(ops)} | [{slug(tag)}.md](./{slug(tag)}.md) |")
idx.append("")
idx.append("## Every endpoint\n")
for tag, ops in sorted(ops_by_tag.items()):
    idx.append(f"### {tag}\n")
    for method, path, op in ops:
        s = op.get("summary") or ""
        idx.append(f"- `{method} {path}`" + (f" — {s}" if s else "") +
                   f"  ·  [details](./{slug(tag)}.md#{slug(method + ' ' + path)})")
    idx.append("")
(HERE / "README.md").write_text("\n".join(idx))

print(f"Wrote {len(ops_by_tag)} group files + README.md ({total_ops} endpoints) to {HERE}")
