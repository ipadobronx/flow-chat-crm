-- Add foreign key constraint from agendamentos_ligacoes to leads
ALTER TABLE agendamentos_ligacoes 
ADD CONSTRAINT agendamentos_ligacoes_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;