import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useTableRows } from "@/lib/admin";

export interface CrudField {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "boolean" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
  hideInTable?: boolean;
  placeholder?: string;
}

interface Props {
  table: string;
  title: string;
  description?: string;
  fields: CrudField[];
  orderBy?: string;
  ascending?: boolean;
  select?: string;
}

type Row = Record<string, unknown>;

export function CrudManager({
  table,
  title,
  description,
  fields,
  orderBy = "created_at",
  ascending = false,
  select = "*",
}: Props) {
  const queryClient = useQueryClient();
  const { data: rows = [], isLoading } = useTableRows<Row>(table, select, orderBy, ascending);
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Row>({});

  function reset() {
    setOpen(false);
    setEditing(null);
    setForm({});
  }

  const save = useMutation({
    mutationFn: async (payload: Row) => {
      const body: Row = {};
      for (const field of fields) {
        let value = payload[field.name];
        if (field.type === "number") value = value === "" || value == null ? 0 : Number(value);
        if (field.type === "boolean") value = Boolean(value);
        if (value === "") value = null;
        body[field.name] = value;
      }
      if (editing?.id) {
        const { error } = await supabase
          .from(table as never)
          .update(body as never)
          .eq("id", editing.id as string);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(table as never)
          .insert(body as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("تم الحفظ");
      queryClient.invalidateQueries({ queryKey: ["admin", table] });
      reset();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(table as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم الحذف");
      queryClient.invalidateQueries({ queryKey: ["admin", table] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const tableFields = fields.filter((f) => !f.hideInTable).slice(0, 4);

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setForm({});
            setOpen(true);
          }}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" /> إضافة
        </Button>
      </header>

      {open ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(form);
          }}
          className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-2"
        >
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={field.name}
                  value={(form[field.name] as string) ?? ""}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  required={field.required}
                  rows={3}
                />
              ) : field.type === "boolean" ? (
                <div className="flex h-9 items-center">
                  <Switch
                    id={field.name}
                    checked={Boolean(form[field.name])}
                    onCheckedChange={(v) => setForm({ ...form, [field.name]: v })}
                  />
                </div>
              ) : field.type === "select" ? (
                <select
                  id={field.name}
                  value={(form[field.name] as string) ?? ""}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">— بدون —</option>
                  {(field.options ?? []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={field.name}
                  type={field.type === "number" ? "number" : "text"}
                  placeholder={field.placeholder}
                  value={(form[field.name] as string) ?? ""}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  required={field.required}
                />
              )}
            </div>
          ))}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={save.isPending}>
              حفظ
            </Button>
            <Button type="button" variant="outline" onClick={reset}>
              إلغاء
            </Button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs text-muted-foreground">
            <tr>
              {tableFields.map((f) => (
                <th key={f.name} className="px-4 py-3 text-start font-bold">
                  {f.label}
                </th>
              ))}
              <th className="px-4 py-3 text-start font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={tableFields.length + 1} className="px-4 py-8 text-center text-muted-foreground">
                  جاري التحميل...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={tableFields.length + 1} className="px-4 py-8 text-center text-muted-foreground">
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={String(row.id)}>
                  {tableFields.map((f) => {
                    const value = row[f.name];
                    return (
                      <td key={f.name} className="max-w-64 truncate px-4 py-3">
                        {typeof value === "boolean" ? (value ? "نعم" : "لا") : String(value ?? "—")}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label="تعديل"
                        onClick={() => {
                          setEditing(row);
                          setForm(row);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label="حذف"
                        onClick={() => {
                          if (confirm("تأكيد الحذف؟")) remove.mutate(String(row.id));
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
