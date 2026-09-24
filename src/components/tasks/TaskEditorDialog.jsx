import { useEffect, useMemo, useState } from 'react';
import Dialog from '../ui/dialog';
import Button from '../ui/Button';
import Input from '../ui/input';
import Textarea from '../ui/textarea';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { DEPARTMENTS } from '../../constants/departments';

const PRIORITY_OPTIONS = [
  { value: 'LOW', fr: 'Basse', en: 'Low' },
  { value: 'MEDIUM', fr: 'Moyenne', en: 'Medium' },
  { value: 'HIGH', fr: 'Haute', en: 'High' },
  { value: 'URGENT', fr: 'Urgente', en: 'Urgent' },
];

const BUSINESS_METRICS = {
  SALES: [
    { key: 'salesCount', fr: 'Ventes réalisées', en: 'Completed sales', unitFr: 'vente(s)', unitEn: 'sale(s)' },
    { key: 'revenue', fr: 'Chiffre d’affaires', en: 'Revenue', unitFr: 'FCFA', unitEn: 'FCFA' },
    { key: 'profit', fr: 'Résultat', en: 'Profit', unitFr: 'FCFA', unitEn: 'FCFA' },
  ],
  MARKETING: [
    { key: 'prospects', fr: 'Prospects', en: 'Prospects', unitFr: 'prospect(s)', unitEn: 'prospect(s)' },
    { key: 'qualifiedLeads', fr: 'Leads qualifiés', en: 'Qualified leads', unitFr: 'lead(s)', unitEn: 'lead(s)' },
    { key: 'conversions', fr: 'Conversions', en: 'Conversions', unitFr: 'conversion(s)', unitEn: 'conversion(s)' },
    { key: 'spend', fr: 'Dépenses marketing', en: 'Marketing spend', unitFr: 'FCFA', unitEn: 'FCFA' },
  ],
  FINANCE: [
    { key: 'revenue', fr: 'Revenus', en: 'Revenue', unitFr: 'FCFA', unitEn: 'FCFA' },
    { key: 'expenses', fr: 'Dépenses', en: 'Expenses', unitFr: 'FCFA', unitEn: 'FCFA' },
    { key: 'profit', fr: 'Résultat', en: 'Profit', unitFr: 'FCFA', unitEn: 'FCFA' },
  ],
  LOGISTICS: [
    { key: 'orders', fr: 'Commandes', en: 'Orders', unitFr: 'commande(s)', unitEn: 'order(s)' },
    { key: 'deliveries', fr: 'Livraisons', en: 'Deliveries', unitFr: 'livraison(s)', unitEn: 'delivery(ies)' },
    { key: 'onTimeDeliveries', fr: 'Livraisons à temps', en: 'On-time deliveries', unitFr: 'livraison(s)', unitEn: 'delivery(ies)' },
    { key: 'incidents', fr: 'Incidents', en: 'Incidents', unitFr: 'incident(s)', unitEn: 'incident(s)' },
  ],
  STOCK: [
    { key: 'stockIn', fr: 'Entrées', en: 'Stock in', unitFr: 'unité(s)', unitEn: 'unit(s)' },
    { key: 'stockOut', fr: 'Sorties', en: 'Stock out', unitFr: 'unité(s)', unitEn: 'unit(s)' },
    { key: 'stockLevel', fr: 'Stock disponible', en: 'Available stock', unitFr: 'unité(s)', unitEn: 'unit(s)' },
    { key: 'stockouts', fr: 'Ruptures', en: 'Stockouts', unitFr: 'rupture(s)', unitEn: 'stockout(s)' },
  ],
  PRODUCTION: [
    { key: 'produced', fr: 'Production réalisée', en: 'Production completed', unitFr: 'unité(s)', unitEn: 'unit(s)' },
    { key: 'target', fr: 'Objectif de production', en: 'Production target', unitFr: 'unité(s)', unitEn: 'unit(s)' },
    { key: 'defects', fr: 'Défauts', en: 'Defects', unitFr: 'défaut(s)', unitEn: 'defect(s)' },
  ],
  HR: [
    { key: 'recruits', fr: 'Recrutements', en: 'Recruitments', unitFr: 'personne(s)', unitEn: 'person(s)' },
    { key: 'training', fr: 'Formations réalisées', en: 'Training completed', unitFr: 'formation(s)', unitEn: 'training session(s)' },
    { key: 'absences', fr: 'Absences', en: 'Absences', unitFr: 'jour(s)', unitEn: 'day(s)' },
  ],
  CUSTOMER_SERVICE: [
    { key: 'tickets', fr: 'Demandes reçues', en: 'Requests received', unitFr: 'demande(s)', unitEn: 'request(s)' },
    { key: 'resolved', fr: 'Demandes résolues', en: 'Requests resolved', unitFr: 'demande(s)', unitEn: 'request(s)' },
    { key: 'satisfaction', fr: 'Satisfaction moyenne', en: 'Average satisfaction', unitFr: '%', unitEn: '%' },
  ],
  ADMIN: [
    { key: 'processed', fr: 'Dossiers traités', en: 'Cases processed', unitFr: 'dossier(s)', unitEn: 'case(s)' },
    { key: 'overdue', fr: 'Dossiers en retard', en: 'Overdue cases', unitFr: 'dossier(s)', unitEn: 'case(s)' },
    { key: 'incidents', fr: 'Incidents', en: 'Incidents', unitFr: 'incident(s)', unitEn: 'incident(s)' },
  ],
  IT: [
    { key: 'incidents', fr: 'Incidents', en: 'Incidents', unitFr: 'incident(s)', unitEn: 'incident(s)' },
    { key: 'resolved', fr: 'Incidents résolus', en: 'Incidents resolved', unitFr: 'incident(s)', unitEn: 'incident(s)' },
    { key: 'deployments', fr: 'Déploiements', en: 'Deployments', unitFr: 'déploiement(s)', unitEn: 'deployment(s)' },
  ],
  OTHER: [
    { key: 'activity', fr: 'Activité réalisée', en: 'Completed activity', unitFr: 'unité(s)', unitEn: 'unit(s)' },
    { key: 'target', fr: 'Objectif', en: 'Target', unitFr: 'unité(s)', unitEn: 'unit(s)' },
  ],
};

const EMPTY_FORM = {
  title: '',
  description: '',
  assigneeId: '',
  projectId: '',
  sectionId: '',
  priority: 'MEDIUM',
  deadline: '',
  estimatePoints: 1,
  activityType: '',
  plannedValue: '',
  activityUnit: '',
};

function departmentLabel(value, english = false) {
  const found = DEPARTMENTS.find((department) => department.value === value);
  if (!found) return value || (english ? 'Department not defined' : 'Département non défini');
  const label = String(found.label || '').replace(/^Département\s+/i, '');
  const translations = {
    'projet': 'Project',
    'de vente': 'Sales',
    marketing: 'Marketing',
    financier: 'Finance',
    logistique: 'Logistics',
    stock: 'Stock',
    production: 'Production',
    'ressources humaines': 'Human resources',
    'service client': 'Customer service',
    administratif: 'Administration',
    informatique: 'IT',
    'autre département': 'Other',
  };
  return english ? (translations[label.toLowerCase()] || label) : label;
}

function metricFor(department, key) {
  return (BUSINESS_METRICS[department] || []).find((metric) => metric.key === key) || null;
}

export default function TaskEditorDialog({
  open,
  onClose,
  onSubmit,
  title = 'Nouvelle tâche',
  submitLabel = 'Enregistrer',
  initialValues = EMPTY_FORM,
  assignees = [],
  projects = [],
  sections = [],
  loading = false,
}) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState(EMPTY_FORM);

  const isEnglish = typeof t === 'function' && t('tasks') === 'Tasks';
  const role = String(profile?.role || '').toUpperCase();
  const canChooseAssignee = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role) && assignees.length > 0;

  const selectedAssignee = useMemo(() => {
    const id = form.assigneeId || profile?.uid;
    return assignees.find((employee) => String(employee.uid) === String(id)) || (String(profile?.uid) === String(id) ? profile : null);
  }, [assignees, form.assigneeId, profile]);

  const currentDepartment = String(selectedAssignee?.department || profile?.department || 'PROJECT').toUpperCase();
  const metrics = BUSINESS_METRICS[currentDepartment] || [];

  const availableSections = useMemo(
    () => sections.filter((section) => !form.projectId || String(section.projectId) === String(form.projectId)),
    [sections, form.projectId]
  );

  useEffect(() => {
    if (!open) return;
    const initial = { ...EMPTY_FORM, ...(initialValues || {}) };
    const initialAssignee = initial.assigneeId || (!canChooseAssignee ? profile?.uid || '' : '');
    const employee = assignees.find((item) => String(item.uid) === String(initialAssignee));
    const department = String(employee?.department || profile?.department || 'PROJECT').toUpperCase();
    const metric = metricFor(department, initial.activityType) || BUSINESS_METRICS[department]?.[0] || null;

    setForm({
      ...initial,
      assigneeId: initialAssignee,
      activityType: metric?.key || initial.activityType || '',
      activityUnit: metric ? (isEnglish ? metric.unitEn : metric.unitFr) : initial.activityUnit || '',
      plannedValue: initial.plannedValue ?? '',
    });
  }, [open, initialValues, profile?.uid, profile?.department, canChooseAssignee, assignees, isEnglish]);

  useEffect(() => {
    const metric = metricFor(currentDepartment, form.activityType) || metrics[0] || null;
    if (!metric) {
      if (form.activityType || form.activityUnit) setForm((current) => ({ ...current, activityType: '', activityUnit: '' }));
      return;
    }
    const unit = isEnglish ? metric.unitEn : metric.unitFr;
    if (form.activityType !== metric.key || form.activityUnit !== unit) {
      setForm((current) => ({ ...current, activityType: metric.key, activityUnit: unit }));
    }
  }, [currentDepartment, metrics, form.activityType, form.activityUnit, isEnglish]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleAssigneeChange(value) {
    const employee = assignees.find((item) => String(item.uid) === String(value));
    const department = String(employee?.department || 'PROJECT').toUpperCase();
    const metric = BUSINESS_METRICS[department]?.[0];
    setForm((current) => ({
      ...current,
      assigneeId: value,
      activityType: metric?.key || '',
      activityUnit: metric ? (isEnglish ? metric.unitEn : metric.unitFr) : '',
      plannedValue: '',
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      ...form,
      assigneeId: canChooseAssignee ? form.assigneeId : profile?.uid,
      estimatePoints: Number(form.estimatePoints || 1),
      plannedValue: form.plannedValue === '' ? 0 : Number(form.plannedValue || 0),
      activityUnit: form.activityUnit || null,
    };
    onSubmit?.(payload);
  }

  const text = {
    title: isEnglish ? 'Title' : 'Titre',
    description: isEnglish ? 'Description' : 'Description',
    descriptionPlaceholder: isEnglish ? 'Describe precisely the expected work.' : 'Décrivez précisément le travail attendu.',
    employee: isEnglish ? 'Assigned employee' : 'Employé destinataire',
    chooseEmployee: isEnglish ? 'Choose an employee' : 'Choisir un employé',
    department: isEnglish ? 'Department' : 'Département',
    project: isEnglish ? 'Project' : 'Projet',
    withoutProject: isEnglish ? 'No project' : 'Sans projet',
    section: isEnglish ? 'Section' : 'Section',
    chooseSection: isEnglish ? 'Choose a section' : 'Choisir une section',
    priority: isEnglish ? 'Priority' : 'Priorité',
    charge: isEnglish ? 'Points / effort' : 'Points / charge',
    deadline: isEnglish ? 'Deadline' : 'Échéance',
    activity: isEnglish ? 'Business activity' : 'Activité métier',
    indicator: isEnglish ? 'Business indicator' : 'Indicateur métier',
    planned: isEnglish ? 'Planned value' : 'Valeur prévue',
    projectTask: isEnglish ? 'Project task' : 'Tâche projet',
    projectTaskHelp: isEnglish ? 'Project-department tasks are evaluated through section progress and task effort.' : 'Les tâches du département projet sont évaluées par la progression des sections et la charge des tâches.',
    cancel: isEnglish ? 'Cancel' : 'Annuler',
  };

  const hasRequiredEmployee = !canChooseAssignee || Boolean(form.assigneeId);

  return (
    <Dialog open={open} onClose={onClose} title={title} className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {canChooseAssignee && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70" htmlFor="task-assignee">
              {text.employee}
            </label>
            <select
              id="task-assignee"
              value={form.assigneeId}
              onChange={(event) => handleAssigneeChange(event.target.value)}
              className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              required
            >
              <option value="">{text.chooseEmployee}</option>
              {assignees.map((assignee) => (
                <option key={assignee.uid} value={assignee.uid}>
                  {assignee.name || assignee.email}
                </option>
              ))}
            </select>
          </div>
        )}

        {!hasRequiredEmployee ? (
          <div className="rounded-xl border border-dashed border-line bg-surface-2 p-5 text-center">
            <p className="text-sm font-semibold text-ink">
              {isEnglish ? 'Select an employee first' : 'Sélectionnez d’abord un employé'}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {isEnglish
                ? 'The department and the fields specific to that employee will appear automatically.'
                : 'Le département et les champs spécifiques à cet employé apparaîtront automatiquement.'}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-primary/10 bg-primary/5 p-3">
              <p className="text-[9px] font-bold uppercase tracking-wide text-primary">{text.department}</p>
              <p className="mt-1 text-sm font-bold text-ink">{departmentLabel(currentDepartment, isEnglish)}</p>
              <p className="mt-0.5 text-[10px] text-muted">
                {canChooseAssignee
                  ? (isEnglish
                    ? 'The fields below adapt automatically to the selected employee.'
                    : 'Les champs ci-dessous s’adaptent automatiquement à l’employé sélectionné.')
                  : (isEnglish
                    ? 'Your department is taken from your profile and cannot be changed here.'
                    : 'Votre département vient de votre profil et ne peut pas être modifié ici.')}
              </p>
            </div>

            <Input
              id="task-title"
              label={text.title}
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              placeholder={isEnglish ? 'Ex. Process customer requests' : 'Ex. Traiter les demandes clients'}
              required
            />

            <div>
              <label className="block text-sm font-medium mb-1.5 text-ink/70" htmlFor="task-description">{text.description}</label>
              <Textarea
                id="task-description"
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
                rows={4}
                placeholder={text.descriptionPlaceholder}
              />
            </div>

            {projects.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/70" htmlFor="task-project">{text.project}</label>
                <select
                  id="task-project"
                  value={form.projectId}
                  onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value, sectionId: '' }))}
                  className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  required
                >
                  <option value="">{text.withoutProject}</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name || project.title}</option>)}
                </select>
              </div>
            )}

            {availableSections.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/70" htmlFor="task-section">{text.section}</label>
                <select
                  id="task-section"
                  value={form.sectionId}
                  onChange={(event) => update('sectionId', event.target.value)}
                  className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  required
                >
                  <option value="">{text.chooseSection}</option>
                  {availableSections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
                </select>
              </div>
            )}

            {currentDepartment !== 'PROJECT' && metrics.length > 0 ? (
              <div className="rounded-xl border border-line bg-surface-2 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-primary">{text.activity}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink/70" htmlFor="task-activity-type">{text.indicator}</label>
                    <select
                      id="task-activity-type"
                      value={form.activityType}
                      onChange={(event) => {
                        const metric = metricFor(currentDepartment, event.target.value);
                        update('activityType', event.target.value);
                        update('activityUnit', metric ? (isEnglish ? metric.unitEn : metric.unitFr) : '');
                      }}
                      className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                    >
                      {metrics.map((metric) => <option key={metric.key} value={metric.key}>{isEnglish ? metric.en : metric.fr}</option>)}
                    </select>
                  </div>
                  <Input
                    id="task-planned-value"
                    label={`${text.planned}${form.activityUnit ? ` (${form.activityUnit})` : ''}`}
                    type="number"
                    min="0"
                    step="any"
                    value={form.plannedValue}
                    onChange={(event) => update('plannedValue', event.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line bg-surface-2 p-3">
                <p className="text-xs font-semibold text-ink">{text.projectTask}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-muted">{text.projectTaskHelp}</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/70" htmlFor="task-priority">{text.priority}</label>
                <select
                  id="task-priority"
                  value={form.priority}
                  onChange={(event) => update('priority', event.target.value)}
                  className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  {PRIORITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{isEnglish ? option.en : option.fr}</option>)}
                </select>
              </div>
              <Input id="task-estimate" label={text.charge} type="number" min="1" step="any" value={form.estimatePoints} onChange={(event) => update('estimatePoints', event.target.value)} />
            </div>

            <Input id="task-deadline" label={text.deadline} type="date" value={form.deadline} onChange={(event) => update('deadline', event.target.value)} />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>{text.cancel}</Button>
              <Button type="submit" loading={loading}>{submitLabel}</Button>
            </div>
          </>
        )}
      </form>
    </Dialog>
  );
}
