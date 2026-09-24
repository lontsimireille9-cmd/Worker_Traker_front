import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaProjectDiagram,
  FaUsers,
} from 'react-icons/fa';

import Card from '../components/ui/card';
import Title from '../components/ui/title';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const displayPct = (value) =>
  value === null || value === undefined
    ? '—'
    : `${Math.round(Number(value) || 0)}%`;

const clamp = (value) =>
  Math.min(100, Math.max(0, Number(value) || 0));

function copy(t, key, fr, en) {
  const translated = typeof t === 'function' ? t(key) : key;

  return translated && translated !== key
    ? translated
    : translated === 'Tasks' || translated === 'Dashboard'
      ? en
      : fr;
}

function Metric({
  icon,
  label,
  value,
  hint,
  tone = 'primary',
}) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-600',
  };

  return (
    <Card className="min-w-0 border-line bg-white p-3 sm:p-4">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-xs">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold leading-none text-ink sm:text-3xl">
            {value}
          </p>

          {hint && (
            <p className="mt-1 truncate text-[10px] text-muted sm:text-xs">
              {hint}
            </p>
          )}
        </div>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${tones[tone]}`}
        >
          {icon}
        </span>
      </div>
    </Card>
  );
}

function Progress({ value, tone = 'primary' }) {
  const cls =
    tone === 'success'
      ? 'bg-emerald-500'
      : tone === 'warning'
        ? 'bg-amber-500'
        : tone === 'danger'
          ? 'bg-red-500'
          : 'bg-primary';

  return (
    <div className="h-1.5 w-full min-w-0 overflow-hidden rounded-full bg-surface-2">
      <div
        className={`h-full max-w-full rounded-full ${cls} transition-all`}
        style={{ width: `${clamp(value)}%` }}
      />
    </div>
  );
}

function Delta({ label, value }) {
  const n = Number(value);

  if (
    value === null ||
    value === undefined ||
    Number.isNaN(n)
  ) {
    return (
      <div className="min-w-0 overflow-hidden rounded-lg bg-white px-2 py-1.5 text-center shadow-sm">
        <span className="block truncate text-[9px] font-bold text-muted">
          {label}
        </span>

        <span className="block truncate text-[10px] font-semibold text-muted">
          —
        </span>
      </div>
    );
  }

  const positive = n > 0;
  const negative = n < 0;

  return (
    <div className="min-w-0 overflow-hidden rounded-lg bg-white px-2 py-1.5 text-center shadow-sm">
      <span className="block truncate text-[9px] font-bold text-muted">
        {label}
      </span>

      <span
        className={`block truncate text-[10px] font-bold ${
          positive
            ? 'text-emerald-700'
            : negative
              ? 'text-red-700'
              : 'text-muted'
        }`}
      >
        {positive ? '+' : ''}
        {n}%
      </span>
    </div>
  );
}

function Avatar({ name, role }) {
  const initials = String(name || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary sm:h-9 sm:w-9"
      title={role}
    >
      {initials}
    </div>
  );
}

function SmallStat({ label, value }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg bg-white px-1.5 py-1.5 text-center">
      <p className="truncate text-[8px] text-muted sm:text-[9px]">
        {label}
      </p>

      <p className="truncate text-[11px] font-bold text-ink sm:text-xs">
        {value}
      </p>
    </div>
  );
}

function SectionProgress({ section, t }) {
  const progress = clamp(section.progress);
  const status = String(section.status || '').toUpperCase();

  const statusLabel = {
    ACTIVE: copy(t, 'active', 'En cours', 'Active'),
    COMPLETED: copy(t, 'completed', 'Terminée', 'Completed'),
    PAUSED: copy(t, 'paused', 'En pause', 'Paused'),
    CANCELLED: copy(t, 'cancelled', 'Annulée', 'Cancelled'),
  }[status] || (status || '—');

  return (
    <div className="box-border w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-line bg-surface-2 p-2.5 sm:p-3">
      <div className="flex w-full min-w-0 max-w-full items-start justify-between gap-2">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="block max-w-full truncate text-xs font-bold text-ink sm:text-sm">
            {section.name}
          </p>

          <p className="mt-0.5 max-w-full truncate text-[9px] text-muted sm:text-[10px]">
            {copy(t, 'weight', 'Poids', 'Weight')} :{' '}
            {Number(
              section.normalizedWeight ?? section.weight ?? 0
            ).toLocaleString('fr-FR')}
            %
            {statusLabel !== '—' && <> · {statusLabel}</>}
          </p>
        </div>

        <span className="shrink-0 rounded-lg bg-primary px-2 py-1 text-[10px] font-bold text-white sm:text-xs">
          {displayPct(progress)}
        </span>
      </div>

      <div className="mt-2 w-full min-w-0">
        <Progress
          value={progress}
          tone={progress >= 100 ? 'success' : 'primary'}
        />
      </div>

      <div className="mt-2 grid w-full min-w-0 grid-cols-2 gap-1 sm:grid-cols-3">
        <SmallStat
          label={copy(
            t,
            'validatedWork',
            'Travail validé',
            'Validated work'
          )}
          value={section.validatedPoints ?? 0}
        />

        <SmallStat
          label={copy(
            t,
            'plannedWork',
            'Travail prévu',
            'Planned work'
          )}
          value={section.plannedPoints ?? 0}
        />

        <SmallStat
          label={copy(t, 'weight', 'Poids', 'Weight')}
          value={`${Number(
            section.normalizedWeight ?? section.weight ?? 0
          ).toLocaleString('fr-FR')}%`}
        />
      </div>
    </div>
  );
}

function ProjectKpiCard({ project, t }) {
  const sections = Array.isArray(project.sections)
    ? project.sections
    : [];

  const visibleSections = sections.slice(0, 6);
  const remaining = Math.max(
    0,
    sections.length - visibleSections.length
  );

  const status = String(project.status || '').toUpperCase();

  return (
    <Link
      to={`/projets/${project.id}`}
      className="box-border block w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-line bg-surface-2 p-3 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm sm:p-3.5"
    >
      {/* En-tête projet */}
      <div className="flex w-full min-w-0 max-w-full items-start justify-between gap-3">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="block max-w-full truncate text-xs font-bold text-ink sm:text-sm">
            {project.name}
          </p>

          <p className="mt-0.5 max-w-full truncate text-[9px] text-muted sm:text-[10px]">
            {status || '—'} ·{' '}
            {project.sectionCount ?? sections.length}{' '}
            {copy(
              t,
              'sections',
              'section(s)',
              'section(s)'
            )}
          </p>
        </div>

        <span className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-white">
          {displayPct(project.progress)}
        </span>
      </div>

      {/* Progression projet */}
      <div className="mt-2 w-full min-w-0">
        <Progress
          value={project.progress}
          tone={
            Number(project.progress) >= 100
              ? 'success'
              : 'primary'
          }
        />
      </div>

      {/* Légende */}
      <div className="mt-2 flex w-full min-w-0 items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[9px] font-semibold uppercase tracking-wide text-muted">
          {copy(
            t,
            'projectEvolution',
            'Évolution par sections',
            'Progress by sections'
          )}
        </span>

        <span className="shrink-0 text-[9px] text-muted">
          {copy(
            t,
            'weightedProgress',
            'Progression pondérée',
            'Weighted progress'
          )}
        </span>
      </div>

      {/* Sections */}
      <div className="mt-2 grid w-full min-w-0 max-w-full grid-cols-1 gap-1.5">
        {visibleSections.map((section) => (
          <SectionProgress
            key={section.id}
            section={section}
            t={t}
          />
        ))}

        {!visibleSections.length && (
          <div className="w-full min-w-0 rounded-xl border border-dashed border-line p-4 text-center text-[10px] text-muted">
            {copy(
              t,
              'noSections',
              'Aucune section configurée.',
              'No sections configured.'
            )}
          </div>
        )}

        {remaining > 0 && (
          <p className="pt-1 text-center text-[9px] font-semibold text-primary">
            +{remaining}{' '}
            {copy(
              t,
              'moreSections',
              'autre(s) section(s)',
              'more section(s)'
            )}
          </p>
        )}
      </div>
    </Link>
  );
}

function EmployeeKpiCard({ member, business, t }) {
  const k = member.kpis || {};
  const evolution = k.evolution || {};

  const section = member.sectionNames?.length
    ? member.sectionNames.join(' · ')
    : copy(
        t,
        'noSectionAssigned',
        'Aucune section attribuée',
        'No section assigned'
      );

  const project = member.projectNames?.length
    ? member.projectNames.join(' · ')
    : copy(
        t,
        'noProjectAssigned',
        'Aucun projet attribué',
        'No project assigned'
      );

  const hasSectionData =
    member.sectionCount > 0 && k.total > 0;

  const performance = member.performance;

  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-line bg-surface-2 p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-3">
      <div className="flex min-w-0 gap-2.5 sm:gap-3">
        <Avatar
          name={member.name}
          role={member.role}
        />

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-xs font-bold text-ink sm:text-sm">
                {member.name}
              </p>

              <p className="truncate text-[9px] font-medium uppercase tracking-wide text-muted sm:text-[10px]">
                {member.role === 'MANAGER'
                  ? 'Manager'
                  : 'Employé'}
              </p>
            </div>

            <div className="shrink-0 rounded-lg bg-primary px-2 py-1.5 text-right text-white sm:px-2.5">
              <p className="text-[8px] uppercase tracking-wide opacity-80">
                {copy(
                  t,
                  'execution',
                  'Exécution',
                  'Execution'
                )}
              </p>

              <p className="text-sm font-bold leading-none sm:text-base">
                {hasSectionData
                  ? displayPct(performance)
                  : '—'}
              </p>
            </div>
          </div>

          <div className="mt-1.5 min-w-0 overflow-hidden rounded-lg bg-white px-2 py-1.5">
            <p className="truncate text-[10px] font-semibold text-ink sm:text-[11px]">
              {section}
            </p>

            <p className="truncate text-[9px] text-muted sm:text-[10px]">
              {project}
            </p>
          </div>

          <div className="mt-1.5 grid min-w-0 grid-cols-3 gap-1">
            <Delta label="DoD" value={evolution.dod} />
            <Delta label="WoW" value={evolution.wow} />
            <Delta label="MoM" value={evolution.mom} />
          </div>

          <div className="mt-1.5 grid min-w-0 grid-cols-4 gap-1">
            <SmallStat
              label={copy(
                t,
                'tasks',
                'Tâches',
                'Tasks'
              )}
              value={k.total || 0}
            />

            <SmallStat
              label={copy(
                t,
                'validated',
                'Validées',
                'Validated'
              )}
              value={k.validated || 0}
            />

            <SmallStat
              label={copy(
                t,
                'late',
                'Retard',
                'Late'
              )}
              value={k.overdue || 0}
            />

            <SmallStat
              label={copy(
                t,
                'onTime',
                'À temps',
                'On time'
              )}
              value={displayPct(k.onTimeRate)}
            />
          </div>

          {business?.kpi?.metrics?.length > 0 && (
            <div className="mt-1.5 min-w-0 overflow-hidden rounded-lg bg-primary/5 p-2">
              <div className="flex min-w-0 items-center justify-between gap-2">
                <p className="truncate text-[9px] font-bold uppercase tracking-wide text-primary">
                  KPI métier
                </p>

                <span className="shrink-0 truncate text-[9px] font-semibold text-muted">
                  {String(
                    business.departmentLabel || ''
                  ).replace(
                    /^Département\s+/i,
                    ''
                  )}
                </span>
              </div>

              <div className="mt-1 grid min-w-0 grid-cols-2 gap-1">
                {business.kpi.metrics
                  .slice(0, 4)
                  .map((metric) => (
                    <SmallStat
                      key={metric.key}
                      label={metric.label}
                      value={metric.value}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function TeamKpiCard({ team, t }) {
  const k = team.kpis || {};
  const evolution = k.evolution || {};
  const score = team.progress;

  const tone =
    k.overdue > 0
      ? 'danger'
      : (score ?? 0) >= 70
        ? 'success'
        : 'warning';

  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-line bg-surface-2 p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-3">
      <div className="min-w-0 overflow-hidden rounded-lg bg-white px-2.5 py-2">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="truncate text-xs font-bold text-ink sm:text-sm">
              {team.name}
            </p>

            <p className="truncate text-[9px] text-muted sm:text-[10px]">
              Responsable :{' '}
              {team.managerName || 'Non défini'} ·{' '}
              {team.memberCount || 0} membre(s)
            </p>
          </div>

          <span className="shrink-0 rounded-lg bg-primary px-2 py-1 text-xs font-bold text-white">
            {displayPct(score)}
          </span>
        </div>
      </div>

      <div className="mt-2 flex min-w-0 items-center gap-2">
        <div className="min-w-0 flex-1">
          <Progress
            value={score}
            tone={tone}
          />
        </div>

        <span className="shrink-0 text-[9px] font-semibold text-muted">
          Indice d'exécution
        </span>
      </div>

      <div className="mt-1.5 grid min-w-0 grid-cols-3 gap-1">
        <Delta
          label="DoD"
          value={evolution.dod}
        />
        <Delta
          label="WoW"
          value={evolution.wow}
        />
        <Delta
          label="MoM"
          value={evolution.mom}
        />
      </div>

      <div className="mt-1.5 grid min-w-0 grid-cols-4 gap-1">
        <SmallStat
          label="Tâches"
          value={k.total || 0}
        />

        <SmallStat
          label="Validées"
          value={k.validated || 0}
        />

        <SmallStat
          label="Retard"
          value={k.overdue || 0}
        />

        <SmallStat
          label="À temps"
          value={displayPct(k.onTimeRate)}
        />
      </div>
    </article>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    setLoading(true);
    setError('');

    api
      .get('/analytics')
      .then((value) => {
        if (alive) {
          setData(value);
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e.message);
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, []);

  /*
   * IMPORTANT :
   * Tous les hooks doivent être exécutés à chaque rendu,
   * dans le même ordre.
   *
   * Le useMemo était auparavant placé après les return
   * loading/error, ce qui provoquait :
   *
   * "Rendered more hooks than during the previous render"
   *
   * On calcule donc projectSummary ici, avant les return.
   */
  const projects = data?.projects || [];

  const projectSummary = useMemo(
    () => ({
      sections: projects.reduce(
        (sum, project) =>
          sum +
          Number(
            project.sectionCount ||
              project.sections?.length ||
              0
          ),
        0
      ),

      active: projects.filter((project) =>
        ['ACTIVE', 'PLANNED', 'PAUSED'].includes(
          String(project.status || '').toUpperCase()
        )
      ).length,
    }),
    [projects]
  );

  /*
   * État de chargement
   */
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl min-w-0 px-0">
        <Title
          as="h1"
          variant="page"
        >
          {copy(
            t,
            'dashboard',
            'Pilotage de l’entreprise',
            'Company dashboard'
          )}
        </Title>

        <div className="mt-6 animate-pulse space-y-3">
          <div className="h-24 rounded-2xl bg-surface-2" />
          <div className="h-64 rounded-2xl bg-surface-2" />
        </div>
      </div>
    );
  }

  /*
   * Erreur API
   */
  if (error) {
    return (
      <Card className="mx-auto w-full max-w-7xl border-red-200 bg-red-50 text-red-700">
        {error}
      </Card>
    );
  }

  const s = data?.summary || {};
  const k = s.taskKpis || {};

  const alerts = data?.alerts || [];
  const members = data?.memberKpis || [];
  const teams = data?.teamKpis || [];

  const business = data?.businessKpis || {
    departments: [],
    employees: [],
  };

  const businessByEmployee = new Map(
    (business.employees || []).map((item) => [
      String(item.uid),
      item,
    ])
  );

  const canSeeBusiness = [
    'SUPER_ADMIN',
    'ADMIN',
  ].includes(
    String(profile?.role || '').toUpperCase()
  );

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 overflow-x-hidden pb-6 sm:pb-10">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="mb-4 min-w-0 sm:mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary sm:text-xs">
          Pilotage
        </p>

        <Title
          as="h1"
          variant="page"
          className="mt-0.5 text-xl sm:text-2xl"
        >
          {copy(
            t,
            'hello',
            'Bonjour',
            'Hello'
          )}{' '}
          {profile?.name?.split(' ')[0] ||
            copy(
              t,
              'you',
              'Utilisateur',
              'there'
            )}
        </Title>

        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted">
          {copy(
            t,
            'dashboardDescription',
            'Les chiffres du dashboard séparent l’avancement pondéré des projets de la performance d’exécution des équipes et des employés.',
            'The dashboard separates weighted project progress from team and employee execution performance.'
          )}
        </p>
      </header>

      {/* =====================================================
          KPIs GLOBAUX
      ====================================================== */}
      <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
        <Metric
          icon={<FaProjectDiagram />}
          label={copy(
            t,
            'activeProjects',
            'Projets actifs',
            'Active projects'
          )}
          value={s.activeProjects || 0}
          hint={`${s.totalProjects || 0} ${copy(
            t,
            'total',
            'au total',
            'total'
          )}`}
        />

        <Metric
          icon={<FaCheckCircle />}
          label={copy(
            t,
            'overallProgress',
            'Avancement global',
            'Overall progress'
          )}
          value={displayPct(s.overallProgress)}
          hint={copy(
            t,
            'weightedValidatedWork',
            'Travail validé pondéré',
            'Weighted validated work'
          )}
          tone="success"
        />

        <Metric
          icon={<FaClock />}
          label={copy(
            t,
            'pendingValidations',
            'À valider',
            'Pending validation'
          )}
          value={s.pendingValidations || 0}
          hint={copy(
            t,
            'submissions',
            'Soumissions',
            'Submissions'
          )}
          tone="warning"
        />

        <Metric
          icon={<FaExclamationTriangle />}
          label={copy(
            t,
            'toWatch',
            'À surveiller',
            'To watch'
          )}
          value={
            (s.overdueTasks || 0) +
            (s.blockedTasks || 0)
          }
          hint={`${s.overdueTasks || 0} ${copy(
            t,
            'late',
            'retard',
            'late'
          )} · ${s.blockedTasks || 0} ${copy(
            t,
            'blocked',
            'bloquées',
            'blocked'
          )}`}
          tone="danger"
        />
      </div>

      {/* =====================================================
          PROJETS
      ====================================================== */}
      <Card className="mt-4 min-w-0 overflow-hidden bg-white p-3 sm:mt-5 sm:p-4">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-primary sm:text-xs">
              Projets
            </p>

            <h2 className="text-base font-bold text-ink sm:text-lg">
              {copy(
                t,
                'projectTracking',
                'Évolution des projets',
                'Project evolution'
              )}
            </h2>

            <p className="max-w-3xl text-[10px] text-muted sm:text-xs">
              {copy(
                t,
                'projectTrackingDescription',
                'La progression est présentée par section. Les tâches servent au calcul pondéré mais ne sont pas affichées comme indicateur principal.',
                'Progress is presented by section. Tasks drive the weighted calculation but are not shown as the primary indicator.'
              )}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="text-[9px] font-semibold text-muted">
              {projectSummary.sections}{' '}
              {copy(
                t,
                'sections',
                'sections',
                'sections'
              )}
            </span>

            <Link
              to="/projets"
              className="text-[10px] font-semibold text-primary sm:text-xs"
            >
              {copy(
                t,
                'allProjects',
                'Tous les projets',
                'All projects'
              )}{' '}
              <FaArrowRight className="inline" />
            </Link>
          </div>
        </div>

        <div className="mt-3 grid w-full min-w-0 max-w-full grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
          {projects
            .slice(0, 8)
            .map((project) => (
              <ProjectKpiCard
                key={project.id}
                project={project}
                t={t}
              />
            ))}

          {!projects.length && (
            <p className="py-8 text-center text-xs text-muted sm:col-span-2">
              {copy(
                t,
                'noProjects',
                'Aucun projet à afficher.',
                'No projects to display.'
              )}
            </p>
          )}
        </div>
      </Card>

      {/* =====================================================
          EQUIPES + EMPLOYES
      ====================================================== */}
      <div className="mt-4 grid min-w-0 gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-2">
        {/* Équipes */}
        <Card className="min-w-0 overflow-hidden bg-white p-3 sm:p-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-primary sm:text-xs">
              Équipes
            </p>

            <h2 className="text-base font-bold text-ink sm:text-lg">
              Performance des équipes
            </h2>

            <p className="mt-0.5 text-[10px] leading-relaxed text-muted sm:text-xs">
              Indice d'exécution basé sur l'avancement des
              sections, les délais et la qualité des validations.
            </p>
          </div>

          <div className="mt-3 grid max-h-[430px] min-w-0 grid-cols-1 gap-2.5 overflow-y-auto pr-0.5 sm:grid-cols-2 sm:gap-3">
            {teams.map((team) => (
              <TeamKpiCard
                key={team.id}
                team={team}
                t={t}
              />
            ))}

            {!teams.length && (
              <div className="rounded-xl border border-dashed border-line p-6 text-center text-xs text-muted sm:col-span-2">
                <FaUsers className="mx-auto mb-2 text-primary" />
                Aucune équipe n'est encore configurée.
              </div>
            )}
          </div>

          <div className="mt-3 text-right">
            <Link
              to="/equipes"
              className="text-[10px] font-semibold text-primary sm:text-xs"
            >
              Voir les équipes{' '}
              <FaArrowRight className="inline" />
            </Link>
          </div>
        </Card>

        {/* Employés */}
        <Card className="min-w-0 overflow-hidden bg-white p-3 sm:p-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-primary sm:text-xs">
              Employés
            </p>

            <h2 className="text-base font-bold text-ink sm:text-lg">
              Performance des employés
            </h2>

            <p className="mt-0.5 text-[10px] leading-relaxed text-muted sm:text-xs">
              Le score mesure l'exécution des tâches de leurs
              sections. Il ne remplace pas le KPI métier.
            </p>
          </div>

          <div className="mt-3 grid max-h-[430px] min-w-0 grid-cols-1 gap-2.5 overflow-y-auto pr-0.5 sm:grid-cols-2 sm:gap-3">
            {members.map((member) => (
              <EmployeeKpiCard
                key={member.uid}
                member={member}
                business={businessByEmployee.get(
                  String(member.uid)
                )}
                t={t}
              />
            ))}

            {!members.length && (
              <div className="rounded-xl border border-dashed border-line p-6 text-center text-xs text-muted sm:col-span-2">
                <FaUsers className="mx-auto mb-2 text-primary" />
                Aucun employé ou manager n'est encore
                disponible.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* =====================================================
          ACTIVITE METIER
      ====================================================== */}
      {canSeeBusiness && (
        <Card className="mt-4 min-w-0 overflow-hidden bg-white p-3 sm:mt-5 sm:p-4">
          <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-primary sm:text-xs">
                Activité métier
              </p>

              <h2 className="text-base font-bold text-ink sm:text-lg">
                KPI par département
              </h2>

              <p className="mt-0.5 text-[10px] leading-relaxed text-muted sm:text-xs">
                Chaque département utilise ses propres mesures :
                ventes, CA, prospects, stock, livraisons,
                production, etc.
              </p>
            </div>

            <Link
              to="/activite-metier"
              className="shrink-0 text-[10px] font-semibold text-primary sm:text-xs"
            >
              Saisir une activité{' '}
              <FaArrowRight className="inline" />
            </Link>
          </div>

          <div className="mt-3 grid min-w-0 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {(business.departments || []).map((dep) => (
              <article
                key={dep.department}
                className="min-w-0 overflow-hidden rounded-xl border border-line bg-surface-2 p-3"
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-ink sm:text-sm">
                      {String(
                        dep.label || ''
                      ).replace(
                        /^Département\s+/i,
                        ''
                      )}
                    </p>

                    <p className="truncate text-[9px] text-muted">
                      {dep.memberCount || 0} membre(s) ·{' '}
                      {dep.entryCount || 0} entrée(s)
                    </p>
                  </div>

                  <span className="shrink-0 rounded-lg bg-primary px-2 py-1 text-[10px] font-bold text-white">
                    {Number(
                      dep.performance || 0
                    ).toLocaleString('fr-FR')}
                  </span>
                </div>

                <div className="mt-2 grid min-w-0 grid-cols-2 gap-1">
                  {(dep.metrics || [])
                    .slice(0, 4)
                    .map((metric) => (
                      <SmallStat
                        key={metric.key}
                        label={metric.label}
                        value={Number(
                          metric.value || 0
                        ).toLocaleString('fr-FR')}
                      />
                    ))}
                </div>
              </article>
            ))}

            {!business.departments?.length && (
              <div className="rounded-xl border border-dashed border-line p-6 text-center text-xs text-muted sm:col-span-2 xl:col-span-3">
                Aucune donnée métier saisie.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}