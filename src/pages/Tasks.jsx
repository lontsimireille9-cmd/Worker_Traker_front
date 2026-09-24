import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/card';
import Title from '../components/ui/title';
import Badge from '../components/ui/badge';
import TaskEditorDialog from '../components/tasks/TaskEditorDialog';
import TaskDetailsDialog from '../components/tasks/TaskDetailsDialog';
import {
  formatTaskDate,
  getTaskStatusColor,
  getTaskStatusLabel,
  getTaskTimelineLabel,
  getTaskTimelineTone,
  getTaskDisplayDate,
  sortTasksByDisplayOrder,
} from '../utils/getTaskDisplayStatus';

function copy(t, key, fr, en) {
  const translated = typeof t === 'function' ? t(key) : key;
  return translated && translated !== key ? translated : fr;
}

export default function Tasks() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const role = String(profile?.role || '').toUpperCase();
  const isEmployee = role === 'EMPLOYEE';
  const canAssign = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role);

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid]);

  async function loadData() {
    try {
      const [loadedTasks, loadedProjects, loadedEmployees] = await Promise.all([
        api.get('/tasks').catch(() => []),
        api.get('/projects').catch(() => []),
        canAssign ? api.get('/employees').catch(() => []) : Promise.resolve([]),
      ]);

      const nextProjects = loadedProjects || [];
      const sectionResponses = await Promise.all(
        nextProjects.map(async (project) => {
          try {
            const data = await api.get(`/project-management/projects/${project.id}/sections`);
            return Array.isArray(data) ? data : [];
          } catch {
            return [];
          }
        })
      );

      setTasks(loadedTasks || []);
      setProjects(nextProjects);
      setEmployees(loadedEmployees || []);
      setSections(sectionResponses.flat());
    } catch {
      setTasks([]);
      setProjects([]);
      setEmployees([]);
      setSections([]);
    }
  }

  const orderedTasks = useMemo(() => sortTasksByDisplayOrder(tasks), [tasks]);
  const employeeTasks = useMemo(
    () => orderedTasks.filter((task) => String(task.assigneeId) === String(profile?.uid)),
    [orderedTasks, profile?.uid]
  );

  async function handleCreate(values) {
    setLoading(true);
    try {
      await api.post('/tasks', values);
      setCreateOpen(false);
      await loadData();
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(values) {
    if (!editTask) return;
    setLoading(true);
    try {
      await api.patch(`/tasks/${editTask.id}`, values);
      setEditTask(null);
      await loadData();
    } finally {
      setLoading(false);
    }
  }

  async function handleValidateTask(task) {
    await api.patch(`/tasks/${task.id}/status`, { status: 'COMPLETED' });
    await loadData();
  }

  const dialogTitle = isEmployee
    ? copy(t, 'addTask', 'Ajouter une tâche', 'Add a task')
    : copy(t, 'createTaskForEmployee', 'Créer une tâche pour un employé', 'Create a task for an employee');

  if (isEmployee) {
    return (
      <div className="mx-auto w-full max-w-7xl pb-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Title as="h1" variant="page" className="mb-1">{t('tasks')}</Title>
            <p className="text-sm text-muted">{t('taskDescription')}</p>
          </div>
          <Button className="shrink-0" onClick={() => setCreateOpen(true)}>{t('add')}</Button>
        </div>

        <TaskEditorDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
          title={dialogTitle}
          submitLabel={t('create')}
          projects={projects}
          sections={sections}
          loading={loading}
        />

        <TaskEditorDialog
          open={!!editTask}
          onClose={() => setEditTask(null)}
          onSubmit={handleEdit}
          title={t('editTask')}
          submitLabel={t('save')}
          initialValues={editTask || undefined}
          projects={projects}
          sections={sections}
          loading={loading}
        />

        <div className="space-y-3">
          {employeeTasks.map((task) => (
            <Card key={task.id} className="cursor-pointer hover:border-primary/30" onClick={() => setSelectedTask(task)}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{task.title}</p>
                  <p className="mt-1 text-sm text-muted">{task.description || t('noDescription')}</p>
                  <p className="mt-2 text-xs text-muted">{formatTaskDate(getTaskDisplayDate(task))}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge tone={getTaskTimelineTone(task)}>{getTaskTimelineLabel(task)}</Badge>
                  <Badge className={`border ${getTaskStatusColor(task.status)}`}>{getTaskStatusLabel(task.status)}</Badge>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted">
                {task.projectName && <span>{t('project')} : {task.projectName}</span>}
                {task.sectionName && <span>· {copy(t, 'section', 'Section', 'Section')} : {task.sectionName}</span>}
                {task.department && <span>· {String(task.department).replace(/^DEPARTMENT_/i, '')}</span>}
              </div>
            </Card>
          ))}
          {!employeeTasks.length && <p className="text-sm text-muted">{t('noTasks')}</p>}
        </div>

        <TaskDetailsDialog open={!!selectedTask} onClose={() => setSelectedTask(null)} task={selectedTask} title={t('taskDetails')} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl pb-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Title as="h1" variant="page" className="mb-1">{t('tasks')}</Title>
          <p className="text-sm text-muted">{t('manageTasks')}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>{t('createTask')}</Button>
      </div>

      <TaskEditorDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        title={dialogTitle}
        submitLabel={canAssign ? t('assignTask') : t('create')}
        assignees={employees}
        projects={projects}
        sections={sections}
        loading={loading}
      />

      <TaskEditorDialog
        open={!!editTask}
        onClose={() => setEditTask(null)}
        onSubmit={handleEdit}
        title={t('editTask')}
        submitLabel={t('save')}
        initialValues={editTask || undefined}
        assignees={employees}
        projects={projects}
        sections={sections}
        loading={loading}
      />

      <div className="space-y-3">
        {orderedTasks.map((task) => (
          <Card key={task.id} className="cursor-pointer hover:border-primary/30" onClick={() => setSelectedTask(task)}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-ink">{task.title}</p>
                <p className="mt-1 text-sm text-muted">{t('assignedTo')} {task.assigneeName || task.assigneeId}</p>
                {task.projectName && <p className="text-xs text-muted">{t('project')} : {task.projectName}</p>}
                {task.sectionName && <p className="text-xs text-muted">{copy(t, 'section', 'Section', 'Section')} : {task.sectionName}</p>}
                <p className="mt-2 text-xs text-muted">{formatTaskDate(getTaskDisplayDate(task))}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={getTaskTimelineTone(task)}>{getTaskTimelineLabel(task)}</Badge>
                <Badge className={`border ${getTaskStatusColor(task.status)}`}>{getTaskStatusLabel(task.status)}</Badge>
              </div>
            </div>
          </Card>
        ))}
        {!orderedTasks.length && <p className="text-sm text-muted">{t('noTasks')}</p>}
      </div>

      <TaskDetailsDialog open={!!selectedTask} onClose={() => setSelectedTask(null)} task={selectedTask} title={t('taskDetails')} />
    </div>
  );
}
