import type { SupabaseClient } from "@supabase/supabase-js";
import { cloudRowToLocalRecord, localRecordToCloudRow } from "./mappers";
import { validateCloudRow } from "./schemas";
import type { CloudQRRow } from "./types";
import type {
  CreateQRCodeRecord,
  QRCodeRecord,
  QRRepository,
} from "../storage/types";

export type SupabaseQRRow = CloudQRRow;

export class SupabaseQRRepository
  implements QRRepository
{
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string
  ) {}

  private table() {
    return this.client.from("qr_codes");
  }

  private static toRecord(row: unknown): QRCodeRecord {
    return cloudRowToLocalRecord(validateCloudRow(row));
  }

  async list(): Promise<QRCodeRecord[]> {
    const { data, error } = await this.table()
      .select("*")
      .eq("user_id", this.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(SupabaseQRRepository.toRecord);
  }

  async create(input: CreateQRCodeRecord): Promise<QRCodeRecord> {
    const row = localRecordToCloudRow(input, this.userId);
    const { data, error } = await this.table()
      .insert(row as never)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return SupabaseQRRepository.toRecord(data);
  }

  async get(id: string): Promise<QRCodeRecord | null> {
    const { data, error } = await this.table()
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? SupabaseQRRepository.toRecord(data) : null;
  }

  async update(record: QRCodeRecord): Promise<QRCodeRecord> {
    const { data, error } = await this.table()
      .update({
        name: record.name,
        type: record.type,
        values: record.values,
        customization: record.customization,
        favorite: record.favorite,
        is_dynamic: record.isDynamic,
      } as never)
      .eq("id", record.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return SupabaseQRRepository.toRecord(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.table().delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async clear(): Promise<void> {
    const { error } = await this.table().delete().eq("user_id", this.userId);
    if (error) throw new Error(error.message);
  }

  async saveAll(records: QRCodeRecord[]): Promise<void> {
    const rows = records.map((record) =>
      localRecordToCloudRow(record, this.userId)
    );
    const { error } = await this.table().upsert(rows as never[]);
    if (error) throw new Error(error.message);
  }
}