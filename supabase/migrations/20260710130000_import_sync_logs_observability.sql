alter table public.source_import_runs add column if not exists provider text;
alter table public.source_import_runs add column if not exists trigger_type text;
alter table public.source_import_runs add column if not exists duration_ms integer;
alter table public.source_import_runs add column if not exists success boolean not null default false;
alter table public.source_import_runs add column if not exists errors jsonb not null default '[]'::jsonb;

update public.source_import_runs
set
  provider = coalesce(provider, source_name),
  trigger_type = coalesce(
    trigger_type,
    case
      when run_type = 'cron' then 'cron'
      when run_type in ('manual_api', 'admin_button') or triggered_by = 'admin_api' then 'admin'
      else 'manual'
    end
  ),
  duration_ms = coalesce(
    duration_ms,
    case
      when finished_at is not null then greatest(0, floor(extract(epoch from (finished_at - started_at)) * 1000)::integer)
      else null
    end
  ),
  success = status = 'success',
  errors =
    case
      when summary is not null and summary ? 'errors' then summary -> 'errors'
      when error_message is not null then jsonb_build_array(error_message)
      else '[]'::jsonb
    end;

create index if not exists idx_source_import_runs_provider on public.source_import_runs(provider);
create index if not exists idx_source_import_runs_trigger_type on public.source_import_runs(trigger_type);
create index if not exists idx_source_import_runs_success on public.source_import_runs(success);
