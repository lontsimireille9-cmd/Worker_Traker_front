import { useEffect, useState } from "react";
import { api } from "../services/api";
import Button from "../components/ui/button";
import Card from "../components/ui/card";
import Input from "../components/ui/input";
import Select from "../components/ui/select";
import Title from "../components/ui/title";
import Alert from "../components/ui/alert";
import Badge from "../components/ui/badge";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({ matricule: "", name: "", code: "", role: "EMPLOYEE", department: "", position: "", teamId: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function load() {
    api.get("/employees").then(setEmployees).catch(() => {});
    api.get("/teams").then(setTeams).catch(() => setTeams([]));
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.matricule || !form.name || !form.code) return;
    setLoading(true);
    try {
      await api.post("/employees", form);
      setSuccess(`Employé créé — matricule ${form.matricule}, code ${form.code}`);
      setForm({ matricule: "", name: "", code: "", role: "EMPLOYEE", department: "", position: "", teamId: "" });
      load();
    } catch (err) {
      setError(err.message || "Impossible de créer l'employé.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Title as="h1" variant="page" className="mb-1">
        Employés
      </Title>
      <p className="text-sm text-muted mb-8">
        Créez un accès pour chaque employé : il se connectera avec son matricule et le code que vous lui remettez.
      </p>

      <Card className="mb-8">
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div className="w-40">
            <Input
              id="matricule"
              label="Matricule"
              value={form.matricule}
              onChange={(e) => setForm({ ...form, matricule: e.target.value })}
              placeholder="EMP-0234"
            />
          </div>
          <div className="w-56">
            <Input
              id="name"
              label="Nom complet"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="w-40">
            <Input
              id="code"
              label="Code (mot de passe)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="Min. 6 caractères"
            />
          </div>
          <div className="w-36">
            <label className="block text-sm font-medium mb-1.5 text-ink/70">Rôle</label>
            <Select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              options={[
                { value: "EMPLOYEE", label: "Employé" },
                { value: "MANAGER", label: "Manager" },
              ]}
            />
          </div>
          <div className="w-40">
            <Input id="department" label="Département" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div className="w-40">
            <Input id="position" label="Poste" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium mb-1.5 text-ink/70">Équipe</label>
            <Select
              value={form.teamId}
              onChange={(e) => setForm({ ...form, teamId: e.target.value })}
              options={[{ value: "", label: "Aucune" }, ...teams.map((team) => ({ value: team.id, label: team.name }))]}
            />
          </div>
          <Button type="submit" loading={loading}>
            Créer l'accès
          </Button>
        </form>

        {success && (
          <Alert type="success" className="mt-4">
            {success}
          </Alert>
        )}
        {error && (
          <Alert type="danger" className="mt-4">
            {error}
          </Alert>
        )}
      </Card>

      <div className="space-y-2">
        {employees.map((emp) => (
          <Card key={emp.uid} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">{emp.name}</p>
              <p className="text-xs text-muted">Matricule : {emp.matricule}</p>
              {emp.department && <p className="text-xs text-muted">Département : {emp.department}</p>}
            </div>
            <Badge tone={emp.role === "MANAGER" ? "info" : "neutral"}>{emp.role}</Badge>
          </Card>
        ))}
        {employees.length === 0 && <p className="text-sm text-muted">Aucun employé pour le moment.</p>}
      </div>
    </div>
  );
}
