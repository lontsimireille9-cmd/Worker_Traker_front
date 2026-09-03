import { useEffect, useState } from "react";
import Dialog from "../ui/dialog";
import Button from "../ui/button";
import Input from "../ui/input";
import Textarea from "../ui/textarea";

const EMPTY_FORM = {
  title: "",
  description: "",
};

export default function TaskEditorDialog({
  open,
  onClose,
  onSubmit,
  title = "Nouvelle tâche",
  submitLabel = "Enregistrer",
  initialValues = EMPTY_FORM,
  assignees = [],
  loading = false,
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm({
        title: initialValues.title || "",
        description: initialValues.description || "",
        assigneeId: initialValues.assigneeId || "",
      });
    }
  }, [open, initialValues]);

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit?.(form);
  }

  return (
    <Dialog open={open} onClose={onClose} title={title} className="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="task-title"
          label="Titre"
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          placeholder="Ex. Ranger la zone de stockage"
          required
        />

        <div>
          <label className="block text-sm font-medium mb-1.5 text-ink/70" htmlFor="task-description">
            Description
          </label>
          <Textarea
            id="task-description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            rows={5}
            placeholder="Décris ce qui a été fait pendant la journée."
          />
        </div>

        {assignees.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70" htmlFor="task-assignee">
              Employé destinataire
            </label>
            <select
              id="task-assignee"
              value={form.assigneeId}
              onChange={(event) => setForm((current) => ({ ...current, assigneeId: event.target.value }))}
              className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              required
            >
              <option value="">Choisir un employé</option>
              {assignees.map((assignee) => <option key={assignee.uid} value={assignee.uid}>{assignee.name || assignee.email}</option>)}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={loading}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
