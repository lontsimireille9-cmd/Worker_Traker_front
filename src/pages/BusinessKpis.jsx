import { useEffect, useMemo, useState } from 'react';
import Card from '../components/ui/card';
import Title from '../components/ui/title';
import Button from '../components/ui/Button';
import Input from '../components/ui/input';
import Alert from '../components/ui/alert';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS } from '../constants/departments';

const FIELD_LABELS = {
  salesCount: 'Ventes réalisées',
  revenue: 'Chiffre d’affaires',
  profit: 'Résultat',

  prospects: 'Prospects',
  qualifiedLeads: 'Leads qualifiés',
  conversions: 'Conversions',
  spend: 'Dépenses marketing',

  expenses: 'Dépenses',
  orders: 'Commandes',

  deliveries: 'Livraisons',
  onTimeDeliveries: 'Livraisons à temps',
  incidents: 'Incidents',

  stockIn: 'Entrées',
  stockOut: 'Sorties',
  stockLevel: 'Stock disponible',
  stockouts: 'Ruptures',

  produced: 'Production réalisée',
  target: 'Objectif',
  defects: 'Défauts',

  recruits: 'Recrutements',
  training: 'Formations réalisées',
  absences: 'Absences',

  tickets: 'Demandes reçues',
  resolved: 'Demandes résolues',
  satisfaction: 'Satisfaction moyenne',

  processed: 'Dossiers traités',
  overdue: 'Dossiers en retard',

  deployments: 'Déploiements',
  activity: 'Activité réalisée'
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString('fr-FR');
}

function getDepartmentLabel(value) {
  return (
    DEPARTMENTS.find(
      department => department.value === value
    )?.label ||
    value ||
    'Département non défini'
  );
}

function getDepartmentShortLabel(value) {
  return getDepartmentLabel(value).replace(
    /^Département\s+/i,
    ''
  );
}

export default function BusinessKpis() {
  const { profile } = useAuth();

  const [data, setData] = useState(null);

  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [metrics, setMetrics] = useState({});
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  /*
   * Le département est automatiquement récupéré
   * depuis le profil de l'utilisateur connecté.
   *
   * Il n'est jamais sélectionnable depuis cette page.
   */
  const currentDepartment = useMemo(
    () => profile?.department || 'PROJECT',
    [profile]
  );

  const departmentLabel = useMemo(
    () => getDepartmentLabel(currentDepartment),
    [currentDepartment]
  );

  const departmentShortLabel = useMemo(
    () => getDepartmentShortLabel(currentDepartment),
    [currentDepartment]
  );

  /*
   * Les indicateurs disponibles dépendent automatiquement
   * du département de l'utilisateur.
   */
  const definitions =
    data?.metricDefinitions?.[currentDepartment] || [];

  /*
   * Charger les données KPI.
   */
  async function load() {
    setLoading(true);
    setError('');

    try {
      const kpiData = await api.get('/business-kpis');

      setData(kpiData);
    } catch (e) {
      setError(
        e.message ||
        'Impossible de charger vos indicateurs métier.'
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Charger les données une fois que le profil
   * de l'utilisateur est disponible.
   */
  useEffect(() => {
    if (!profile?.uid) {
      return;
    }

    load();
  }, [profile?.uid]);

  /*
   * Générer automatiquement les champs
   * correspondant au département de l'utilisateur.
   */
  useEffect(() => {
    setMetrics(
      Object.fromEntries(
        definitions.map(definition => [
          definition.key,
          ''
        ])
      )
    );
  }, [currentDepartment, data]);

  /*
   * Enregistrer uniquement l'activité
   * de l'utilisateur connecté.
   */
  async function save() {
    setMessage('');
    setError('');

    if (!profile?.uid) {
      setError(
        'Utilisateur non identifié.'
      );
      return;
    }

    /*
     * Le département PROJECT est calculé
     * automatiquement par les projets.
     */
    if (currentDepartment === 'PROJECT') {
      setError(
        'Votre activité projet est calculée automatiquement à partir des projets, sections, tâches et validations.'
      );
      return;
    }

    /*
     * Vérifier qu'au moins un indicateur
     * a été renseigné.
     */
    const hasValue = Object.values(metrics).some(
      value =>
        value !== '' &&
        value !== null &&
        value !== undefined
    );

    if (!hasValue) {
      setError(
        'Veuillez renseigner au moins un indicateur.'
      );
      return;
    }

    setSaving(true);

    try {
      await api.post(
        '/business-kpis/entries',
        {
          /*
           * Toujours l'utilisateur connecté.
           */
          employeeId: profile.uid,

          /*
           * Toujours le département du profil.
           */
          department: currentDepartment,

          date,

          metrics,

          note
        }
      );

      setMessage(
        'Votre activité a été enregistrée avec succès.'
      );

      setNote('');

      /*
       * Vider les champs après l'enregistrement.
       */
      setMetrics(
        Object.fromEntries(
          definitions.map(definition => [
            definition.key,
            ''
          ])
        )
      );

      await load();
    } catch (e) {
      setError(
        e.message ||
        'Impossible d’enregistrer votre activité.'
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * Chargement.
   */
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <Title as="h1" variant="page">
          Mon activité
        </Title>

        <div className="mt-6 h-72 animate-pulse rounded-2xl bg-surface-2" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 overflow-x-hidden pb-10">

      {/* =========================
          HEADER
      ========================== */}

      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary sm:text-xs">
          Mon activité
        </p>

        <Title
          as="h1"
          variant="page"
          className="mt-1"
        >
          Déclarer mon activité
        </Title>

        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted sm:text-sm">
          Renseignez les résultats de votre activité.
          Ces données sont utilisées avec l'exécution de
          vos tâches et de vos sections afin d'établir
          votre performance.
        </p>
      </div>

      {/* =========================
          PROFIL
      ========================== */}

      <Card className="mb-4 min-w-0 bg-white p-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          {/* Nom */}

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Collaborateur
            </p>

            <p className="mt-0.5 truncate text-base font-bold text-ink">
              {profile?.name ||
                profile?.email ||
                'Utilisateur'}
            </p>

            {profile?.email &&
              profile?.name && (
                <p className="mt-0.5 truncate text-[10px] text-muted">
                  {profile.email}
                </p>
              )}
          </div>

          {/* Département */}

          <div className="min-w-0 rounded-xl bg-primary/10 px-4 py-2.5 sm:text-right">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-primary">
              Mon département
            </p>

            <p className="mt-0.5 truncate text-sm font-bold text-primary">
              {departmentShortLabel}
            </p>
          </div>

        </div>
      </Card>

      {/* =========================
          MESSAGES
      ========================== */}

      {message && (
        <Alert
          type="success"
          className="mb-4"
        >
          {message}
        </Alert>
      )}

      {error && (
        <Alert
          type="danger"
          className="mb-4"
        >
          {error}
        </Alert>
      )}

      {/* =========================
          CONTENU
      ========================== */}

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.75fr)]">

        {/* =========================
            DÉCLARATION
        ========================== */}

        <Card className="min-w-0 bg-white p-4">

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
              Déclaration
            </p>

            <h2 className="mt-1 text-base font-bold text-ink">
              Résultats du jour
            </h2>

            <p className="mt-1 text-xs leading-relaxed text-muted">
              Les indicateurs affichés correspondent
              automatiquement à votre département :
              <span className="font-semibold text-ink">
                {' '}{departmentShortLabel}
              </span>.
            </p>
          </div>

          {/* DATE */}

          <div className="mt-4">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={e =>
                setDate(e.target.value)
              }
            />
          </div>

          {/* =========================
              PROJET
          ========================== */}

          {currentDepartment === 'PROJECT' ? (
            <div className="mt-5 rounded-xl border border-dashed border-line bg-surface-2 p-5">

              <p className="text-sm font-semibold text-ink">
                Activité projet
              </p>

              <p className="mt-1 text-xs leading-relaxed text-muted">
                Votre performance projet est calculée
                automatiquement à partir des projets,
                sections, tâches, validations et échéances.
              </p>

              <div className="mt-3 rounded-lg bg-white p-3 text-xs text-muted">
                Aucune saisie manuelle n'est nécessaire
                pour ce département.
              </div>

            </div>
          ) : (
            <>
              {/* =========================
                  INDICATEURS
              ========================== */}

              <div className="mt-5">

                <p className="mb-2 text-xs font-semibold text-ink">
                  Indicateurs de votre département
                </p>

                {definitions.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">

                    {definitions.map(
                      definition => (
                        <Input
                          key={definition.key}
                          label={`${FIELD_LABELS[definition.key] || definition.label}${definition.unit ? ` (${definition.unit})` : ''}`}
                          type="number"
                          min="0"
                          step="any"
                          value={
                            metrics[
                              definition.key
                            ] ?? ''
                          }
                          onChange={e =>
                            setMetrics(
                              previous => ({
                                ...previous,
                                [definition.key]:
                                  e.target.value
                              })
                            )
                          }
                        />
                      )
                    )}

                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-line bg-surface-2 p-5 text-center">

                    <p className="text-sm font-semibold text-ink">
                      Aucun indicateur configuré
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      Votre département ne possède
                      actuellement aucun indicateur métier
                      à renseigner.
                    </p>

                  </div>
                )}

              </div>

              {/* =========================
                  NOTE
              ========================== */}

              {definitions.length > 0 && (
                <div className="mt-4">

                  <Input
                    label="Note facultative"
                    value={note}
                    onChange={e =>
                      setNote(e.target.value)
                    }
                    placeholder="Ajoutez éventuellement un contexte ou une précision..."
                  />

                </div>
              )}

              {/* =========================
                  ACTION
              ========================== */}

              {definitions.length > 0 && (
                <div className="mt-4 flex justify-end">

                  <Button
                    onClick={save}
                    loading={saving}
                  >
                    Enregistrer mon activité
                  </Button>

                </div>
              )}
            </>
          )}

        </Card>

        {/* =========================
            EXPLICATION KPI
        ========================== */}

        <Card className="min-w-0 bg-white p-4">

          <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
            Votre performance
          </p>

          <h2 className="mt-1 text-base font-bold text-ink">
            Comment votre KPI est établi
          </h2>

          <p className="mt-1 text-xs leading-relaxed text-muted">
            Les données que vous déclarez ne constituent
            qu'une partie de votre performance.
          </p>

          <div className="mt-4 space-y-2">

            {/* ACTIVITÉ */}

            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-xs font-bold text-ink">
                1. Activité métier
              </p>

              <p className="mt-1 text-[10px] leading-relaxed text-muted">
                Résultats propres à votre département :
                ventes, prospects, livraisons, production,
                stock, etc.
              </p>
            </div>

            {/* TÂCHES */}

            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-xs font-bold text-ink">
                2. Exécution des tâches
              </p>

              <p className="mt-1 text-[10px] leading-relaxed text-muted">
                Les tâches de vos sections sont prises
                en compte selon leur état et leur validation.
              </p>
            </div>

            {/* ÉCHÉANCES */}

            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-xs font-bold text-ink">
                3. Respect des échéances
              </p>

              <p className="mt-1 text-[10px] leading-relaxed text-muted">
                Les retards et les tâches réalisées dans
                les délais permettent de mesurer la
                régularité de l'exécution.
              </p>
            </div>

          </div>

          {/* IMPORTANT */}

          <div className="mt-4 rounded-xl border border-primary/10 bg-primary/5 p-3">

            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
              Important
            </p>

            <p className="mt-1 text-[10px] leading-relaxed text-muted">
              Le KPI final est calculé par l'entreprise
              à partir de plusieurs indicateurs. Une seule
              valeur déclarée ne détermine donc pas à elle
              seule votre performance.
            </p>

          </div>

        </Card>

      </div>

      {/* =========================
          INDICATEURS ACTUELS
      ========================== */}

      <Card className="mt-4 min-w-0 bg-white p-4">

        <div className="flex min-w-0 items-center justify-between gap-3">

          <div className="min-w-0">

            <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
              Suivi
            </p>

            <h2 className="mt-1 text-base font-bold text-ink">
              Indicateurs actuels
            </h2>

            <p className="mt-1 text-xs text-muted">
              Données disponibles pour votre département :
              <span className="font-semibold text-ink">
                {' '}{departmentShortLabel}
              </span>.
            </p>

          </div>

        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">

          {(
            data?.departments?.find(
              department =>
                department.department ===
                currentDepartment
            )?.metrics || []
          )
            .slice(0, 6)
            .map(metric => (

              <div
                key={metric.key}
                className="rounded-xl border border-line bg-surface-2 p-3"
              >

                <p className="truncate text-[10px] text-muted">
                  {metric.label}
                </p>

                <div className="mt-1 flex items-baseline gap-2">

                  <span className="text-lg font-bold text-ink">
                    {formatNumber(metric.value)}
                  </span>

                  {metric.delta !== null &&
                    metric.delta !== undefined && (
                      <span
                        className={
                          Number(metric.delta) >= 0
                            ? 'text-[10px] font-bold text-emerald-600'
                            : 'text-[10px] font-bold text-red-600'
                        }
                      >
                        {Number(metric.delta) > 0
                          ? '+'
                          : ''}
                        {metric.delta}%
                      </span>
                    )}

                </div>

                <p className="mt-0.5 text-[9px] text-muted">
                  Évolution par rapport à la période précédente
                </p>

              </div>

            ))}

          {!data?.departments?.find(
            department =>
              department.department ===
              currentDepartment
          )?.metrics?.length && (
            <div className="rounded-xl border border-dashed border-line bg-surface-2 p-5 text-center sm:col-span-2 lg:col-span-3">

              <p className="text-sm font-semibold text-ink">
                Aucune donnée enregistrée
              </p>

              <p className="mt-1 text-xs text-muted">
                Vos indicateurs apparaîtront ici après
                votre première déclaration d'activité.
              </p>

            </div>
          )}

        </div>

      </Card>

    </div>
  );
}