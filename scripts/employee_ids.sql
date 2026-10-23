-- Read-only. Lists every employee with their HRMS employee number and login (user) number,
-- and marks who is set as Head of a Domain. Changes nothing.
SELECT
  trim(coalesce(e.first_name, '') || ' ' || coalesce(e.last_name, '')) AS employee_name,
  e.hrms_employee_id AS hrms_employee_number,
  e.hrms_user_id     AS login_number,
  (d.id IS NOT NULL) AS is_domain_head
FROM marketing_employees e
LEFT JOIN domains d ON d.head_employee_id = e.hrms_employee_id
ORDER BY is_domain_head DESC, employee_name;

-- Number clashes: one person's employee number equals a different person's login number.
SELECT a.hrms_employee_id AS number,
       trim(coalesce(a.first_name, '') || ' ' || coalesce(a.last_name, '')) AS has_this_as_employee_number,
       trim(coalesce(b.first_name, '') || ' ' || coalesce(b.last_name, '')) AS has_this_as_login_number
FROM marketing_employees a
JOIN marketing_employees b ON a.hrms_employee_id = b.hrms_user_id
WHERE a.id <> b.id;
