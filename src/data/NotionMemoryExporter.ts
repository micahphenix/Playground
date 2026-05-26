import type { LocalRepository } from './LocalRepository';

// Planned exporter. The handoff calls for Notion as the human-readable
// surface for memory: weekly recaps, editable facts, decision logs. This is
// an *exporter*, not a Repository — it pushes a snapshot of memory into a
// database the user can browse and edit in Notion.
//
// Wiring requires:
//   1) `npm i @notionhq/client`
//   2) A Notion integration token + a database ID the user has shared with
//      the integration. Store both as EXPO_PUBLIC_ vars for now; in prod
//      proxy through a server you control.
//   3) A database schema that matches the MemoryItem shape:
//        Title (title), Kind (select), Detail (rich_text), Created (date)
//
// The export() method below collects everything the LocalRepository holds
// and shapes it into rows suitable for the Notion database. Throws until the
// SDK is in place.

export class NotionMemoryExporter {
  constructor(private repo: LocalRepository, private token?: string, private databaseId?: string) {}

  async export(): Promise<{ exported: number }> {
    if (!this.token || !this.databaseId) {
      throw new Error('NotionMemoryExporter needs EXPO_PUBLIC_NOTION_TOKEN and EXPO_PUBLIC_NOTION_DB_ID.');
    }
    // Pull the snapshot now so we can show progress in the UI later.
    const memory = await this.repo.listMemory();
    const recaps = await this.repo.listRecaps();
    void memory;
    void recaps;
    throw new Error('NotionMemoryExporter is not wired yet. See header comment for the setup checklist.');
  }
}
