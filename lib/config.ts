/** Aktifkan data dummy saat backend belum tersedia. Set false saat backend sudah jalan. */
export function shouldUseDummyData(): boolean {
  return process.env.USE_DUMMY_DATA !== "false";
}

export function isDummyResponse(): boolean {
  return shouldUseDummyData();
}
