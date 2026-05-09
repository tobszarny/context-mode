import{createRequire as P}from"node:module";import{existsSync as j,unlinkSync as D,renameSync as X}from"node:fs";import{tmpdir as W}from"node:os";import{join as H}from"node:path";var L=class{#t;constructor(t){this.#t=t}pragma(t){let s=this.#t.prepare(`PRAGMA ${t}`).all();if(!s||s.length===0)return;if(s.length>1)return s;let i=Object.values(s[0]);return i.length===1?i[0]:s[0]}exec(t){let e="",s=null;for(let o=0;o<t.length;o++){let a=t[o];if(s)e+=a,a===s&&(s=null);else if(a==="'"||a==='"')e+=a,s=a;else if(a===";"){let u=e.trim();u&&this.#t.prepare(u).run(),e=""}else e+=a}let i=e.trim();return i&&this.#t.prepare(i).run(),this}prepare(t){let e=this.#t.prepare(t);return{run:(...s)=>e.run(...s),get:(...s)=>{let i=e.get(...s);return i===null?void 0:i},all:(...s)=>e.all(...s),iterate:(...s)=>e.iterate(...s)}}transaction(t){return this.#t.transaction(t)}close(){this.#t.close()}},R=class{#t;constructor(t){this.#t=t}pragma(t){let s=this.#t.prepare(`PRAGMA ${t}`).all();if(!s||s.length===0)return;if(s.length>1)return s;let i=Object.values(s[0]);return i.length===1?i[0]:s[0]}exec(t){return this.#t.exec(t),this}prepare(t){let e=this.#t.prepare(t);return{run:(...s)=>e.run(...s),get:(...s)=>e.get(...s),all:(...s)=>e.all(...s),iterate:(...s)=>typeof e.iterate=="function"?e.iterate(...s):e.all(...s)[Symbol.iterator]()}}transaction(t){return(...e)=>{this.#t.exec("BEGIN");try{let s=t(...e);return this.#t.exec("COMMIT"),s}catch(s){throw this.#t.exec("ROLLBACK"),s}}}close(){this.#t.close()}},l=null;function Y(r){let t=null;try{return t=new r(":memory:"),t.exec("CREATE VIRTUAL TABLE __fts5_probe USING fts5(x)"),!0}catch{return!1}finally{try{t?.close()}catch{}}}function G(){if(!l){let r=P(import.meta.url);if(globalThis.Bun){let t=r(["bun","sqlite"].join(":")).Database;l=function(s,i){let o=new t(s,{readonly:i?.readonly,create:!0}),a=new L(o);return i?.timeout&&a.pragma(`busy_timeout = ${i.timeout}`),a}}else if(process.platform==="linux"){let t=null;try{({DatabaseSync:t}=r(["node","sqlite"].join(":")))}catch{t=null}t&&Y(t)?l=function(s,i){let o=new t(s,{readOnly:i?.readonly??!1});return new R(o)}:l=r("better-sqlite3")}else l=r("better-sqlite3")}return l}function C(r){r.pragma("journal_mode = WAL"),r.pragma("synchronous = NORMAL");try{r.pragma("mmap_size = 268435456")}catch{}}function O(r){if(!j(r))for(let t of["-wal","-shm"])try{D(r+t)}catch{}}function $(r){for(let t of["","-wal","-shm"])try{D(r+t)}catch{}}function S(r){try{r.pragma("wal_checkpoint(TRUNCATE)")}catch{}try{r.close()}catch{}}function w(r="context-mode"){return H(W(),`${r}-${process.pid}.db`)}function q(r,t=[100,500,2e3]){let e;for(let s=0;s<=t.length;s++)try{return r()}catch(i){let o=i instanceof Error?i.message:String(i);if(!o.includes("SQLITE_BUSY")&&!o.includes("database is locked"))throw i;if(e=i instanceof Error?i:new Error(o),s<t.length){let a=t[s],u=Date.now();for(;Date.now()-u<a;);}}throw new Error(`SQLITE_BUSY: database is locked after ${t.length} retries. Original error: ${e?.message}`)}function K(r){return r.includes("SQLITE_CORRUPT")||r.includes("SQLITE_NOTADB")||r.includes("database disk image is malformed")||r.includes("file is not a database")}function V(r){let t=Date.now();for(let e of["","-wal","-shm"])try{X(r+e,`${r}${e}.corrupt-${t}`)}catch{}}var _=Symbol.for("__context_mode_live_dbs__"),f=(()=>{let r=globalThis;return r[_]||(r[_]=new Set,process.on("exit",()=>{for(let t of r[_])S(t);r[_].clear()})),r[_]})(),p=class{#t;#e;constructor(t){let e=G();this.#t=t,O(t);let s;try{s=new e(t,{timeout:3e4}),C(s)}catch(i){let o=i instanceof Error?i.message:String(i);if(K(o)){V(t),O(t);try{s=new e(t,{timeout:3e4}),C(s)}catch(a){throw new Error(`Failed to create fresh DB after renaming corrupt file: ${a instanceof Error?a.message:String(a)}`)}}else throw i}this.#e=s,f.add(this.#e),this.initSchema(),this.prepareStatements()}get db(){return this.#e}get dbPath(){return this.#t}close(){f.delete(this.#e),S(this.#e)}withRetry(t){return q(t)}cleanup(){f.delete(this.#e),S(this.#e),$(this.#t)}};import{createHash as v}from"node:crypto";import{execFileSync as Q}from"node:child_process";var E;function x(r){let t=r.replace(/\\/g,"/");return/^\/+$/.test(t)?"/":/^[A-Za-z]:\/+$/.test(t)?`${t.slice(0,2)}/`:t.replace(/\/+$/,"")}function F(r,t){return Q("git",["-C",r,...t],{encoding:"utf-8",timeout:2e3,stdio:["ignore","pipe","ignore"]}).trim()}function z(r){let t=F(r,["rev-parse","--show-toplevel"]);return t.length>0?x(t):null}function Z(r){let t=F(r,["worktree","list","--porcelain"]).split(/\r?\n/).find(e=>e.startsWith("worktree "))?.replace("worktree ","")?.trim();return t?x(t):null}function at(r=process.cwd()){let t=process.env.CONTEXT_MODE_SESSION_SUFFIX;if(E&&E.projectDir===r&&E.envSuffix===t)return E.suffix;let e="";if(t!==void 0)e=t?`__${t}`:"";else try{let s=z(r),i=Z(r);s&&i&&s!==i&&(e=`__${v("sha256").update(s).digest("hex").slice(0,8)}`)}catch{}return E={projectDir:r,envSuffix:t,suffix:e},e}function ct(){E=void 0}var I=1e3,U=5;function y(r){let t=Number(r);return!Number.isFinite(t)||t<=0?0:Math.floor(t)}var n={insertEvent:"insertEvent",getEvents:"getEvents",getEventsByType:"getEventsByType",getEventsByPriority:"getEventsByPriority",getEventsByTypeAndPriority:"getEventsByTypeAndPriority",getEventCount:"getEventCount",getLatestAttributedProject:"getLatestAttributedProject",checkDuplicate:"checkDuplicate",evictLowestPriority:"evictLowestPriority",updateMetaLastEvent:"updateMetaLastEvent",ensureSession:"ensureSession",getSessionStats:"getSessionStats",incrementCompactCount:"incrementCompactCount",upsertResume:"upsertResume",getResume:"getResume",markResumeConsumed:"markResumeConsumed",claimLatestUnconsumedResume:"claimLatestUnconsumedResume",deleteEvents:"deleteEvents",deleteMeta:"deleteMeta",deleteResume:"deleteResume",getOldSessions:"getOldSessions",searchEvents:"searchEvents",incrementToolCall:"incrementToolCall",getToolCallTotals:"getToolCallTotals",getToolCallByTool:"getToolCallByTool",getEventBytesSummary:"getEventBytesSummary"},M=class extends p{constructor(t){super(t?.dbPath??w("session"))}stmt(t){return this.stmts.get(t)}initSchema(){try{let e=this.db.pragma("table_xinfo(session_events)").find(s=>s.name==="data_hash");e&&e.hidden!==0&&this.db.exec("DROP TABLE session_events")}catch{}this.db.exec(`
      CREATE TABLE IF NOT EXISTS session_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        priority INTEGER NOT NULL DEFAULT 2,
        data TEXT NOT NULL,
        project_dir TEXT NOT NULL DEFAULT '',
        attribution_source TEXT NOT NULL DEFAULT 'unknown',
        attribution_confidence REAL NOT NULL DEFAULT 0,
        bytes_avoided INTEGER NOT NULL DEFAULT 0,
        bytes_returned INTEGER NOT NULL DEFAULT 0,
        source_hook TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        data_hash TEXT NOT NULL DEFAULT ''
      );

      CREATE INDEX IF NOT EXISTS idx_session_events_session ON session_events(session_id);
      CREATE INDEX IF NOT EXISTS idx_session_events_type ON session_events(session_id, type);
      CREATE INDEX IF NOT EXISTS idx_session_events_priority ON session_events(session_id, priority);

      CREATE TABLE IF NOT EXISTS session_meta (
        session_id TEXT PRIMARY KEY,
        project_dir TEXT NOT NULL,
        started_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_event_at TEXT,
        event_count INTEGER NOT NULL DEFAULT 0,
        compact_count INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS session_resume (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL UNIQUE,
        snapshot TEXT NOT NULL,
        event_count INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        consumed INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS tool_calls (
        session_id TEXT NOT NULL,
        tool TEXT NOT NULL,
        calls INTEGER NOT NULL DEFAULT 0,
        bytes_returned INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (session_id, tool)
      );

      CREATE INDEX IF NOT EXISTS idx_tool_calls_session ON tool_calls(session_id);
    `);try{let t=this.db.pragma("table_xinfo(session_events)"),e=new Set(t.map(s=>s.name));e.has("project_dir")||this.db.exec("ALTER TABLE session_events ADD COLUMN project_dir TEXT NOT NULL DEFAULT ''"),e.has("attribution_source")||this.db.exec("ALTER TABLE session_events ADD COLUMN attribution_source TEXT NOT NULL DEFAULT 'unknown'"),e.has("attribution_confidence")||this.db.exec("ALTER TABLE session_events ADD COLUMN attribution_confidence REAL NOT NULL DEFAULT 0"),e.has("bytes_avoided")||this.db.exec("ALTER TABLE session_events ADD COLUMN bytes_avoided INTEGER NOT NULL DEFAULT 0"),e.has("bytes_returned")||this.db.exec("ALTER TABLE session_events ADD COLUMN bytes_returned INTEGER NOT NULL DEFAULT 0"),this.db.exec("CREATE INDEX IF NOT EXISTS idx_session_events_project ON session_events(session_id, project_dir)")}catch{}}prepareStatements(){this.stmts=new Map;let t=(e,s)=>{this.stmts.set(e,this.db.prepare(s))};t(n.insertEvent,`INSERT INTO session_events (
         session_id, type, category, priority, data,
         project_dir, attribution_source, attribution_confidence,
         bytes_avoided, bytes_returned,
         source_hook, data_hash
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),t(n.getEvents,`SELECT id, session_id, type, category, priority, data,
              project_dir, attribution_source, attribution_confidence,
              bytes_avoided, bytes_returned,
              source_hook, created_at, data_hash
       FROM session_events WHERE session_id = ? ORDER BY id ASC LIMIT ?`),t(n.getEventsByType,`SELECT id, session_id, type, category, priority, data,
              project_dir, attribution_source, attribution_confidence,
              bytes_avoided, bytes_returned,
              source_hook, created_at, data_hash
       FROM session_events WHERE session_id = ? AND type = ? ORDER BY id ASC LIMIT ?`),t(n.getEventsByPriority,`SELECT id, session_id, type, category, priority, data,
              project_dir, attribution_source, attribution_confidence,
              bytes_avoided, bytes_returned,
              source_hook, created_at, data_hash
       FROM session_events WHERE session_id = ? AND priority >= ? ORDER BY id ASC LIMIT ?`),t(n.getEventsByTypeAndPriority,`SELECT id, session_id, type, category, priority, data,
              project_dir, attribution_source, attribution_confidence,
              bytes_avoided, bytes_returned,
              source_hook, created_at, data_hash
       FROM session_events WHERE session_id = ? AND type = ? AND priority >= ? ORDER BY id ASC LIMIT ?`),t(n.getEventCount,"SELECT COUNT(*) AS cnt FROM session_events WHERE session_id = ?"),t(n.getLatestAttributedProject,`SELECT project_dir
       FROM session_events
       WHERE session_id = ? AND project_dir != ''
       ORDER BY id DESC
       LIMIT 1`),t(n.checkDuplicate,`SELECT 1 FROM (
         SELECT type, data_hash FROM session_events
         WHERE session_id = ? ORDER BY id DESC LIMIT ?
       ) AS recent
       WHERE recent.type = ? AND recent.data_hash = ?
       LIMIT 1`),t(n.evictLowestPriority,`DELETE FROM session_events WHERE id = (
         SELECT id FROM session_events WHERE session_id = ?
         ORDER BY priority ASC, id ASC LIMIT 1
       )`),t(n.updateMetaLastEvent,`UPDATE session_meta
       SET last_event_at = datetime('now'), event_count = event_count + 1
       WHERE session_id = ?`),t(n.ensureSession,"INSERT OR IGNORE INTO session_meta (session_id, project_dir) VALUES (?, ?)"),t(n.getSessionStats,`SELECT session_id, project_dir, started_at, last_event_at, event_count, compact_count
       FROM session_meta WHERE session_id = ?`),t(n.incrementCompactCount,"UPDATE session_meta SET compact_count = compact_count + 1 WHERE session_id = ?"),t(n.upsertResume,`INSERT INTO session_resume (session_id, snapshot, event_count)
       VALUES (?, ?, ?)
       ON CONFLICT(session_id) DO UPDATE SET
         snapshot = excluded.snapshot,
         event_count = excluded.event_count,
         created_at = datetime('now'),
         consumed = 0`),t(n.getResume,"SELECT snapshot, event_count, consumed FROM session_resume WHERE session_id = ?"),t(n.markResumeConsumed,"UPDATE session_resume SET consumed = 1 WHERE session_id = ?"),t(n.claimLatestUnconsumedResume,`UPDATE session_resume
       SET consumed = 1
       WHERE id = (
         SELECT id FROM session_resume
         WHERE consumed = 0
           AND session_id != ?
         ORDER BY created_at DESC, id DESC
         LIMIT 1
       )
       RETURNING session_id, snapshot`),t(n.deleteEvents,"DELETE FROM session_events WHERE session_id = ?"),t(n.deleteMeta,"DELETE FROM session_meta WHERE session_id = ?"),t(n.deleteResume,"DELETE FROM session_resume WHERE session_id = ?"),t(n.searchEvents,`SELECT id, session_id, category, type, data, created_at
       FROM session_events
       WHERE project_dir = ?
         AND (data LIKE '%' || ? || '%' ESCAPE '\\' OR category LIKE '%' || ? || '%' ESCAPE '\\')
         AND (? IS NULL OR category = ?)
       ORDER BY id ASC
       LIMIT ?`),t(n.getOldSessions,"SELECT session_id FROM session_meta WHERE started_at < datetime('now', ? || ' days')"),t(n.incrementToolCall,`INSERT INTO tool_calls (session_id, tool, calls, bytes_returned)
       VALUES (?, ?, 1, ?)
       ON CONFLICT(session_id, tool) DO UPDATE SET
         calls = calls + 1,
         bytes_returned = bytes_returned + excluded.bytes_returned,
         updated_at = datetime('now')`),t(n.getToolCallTotals,`SELECT COALESCE(SUM(calls), 0) AS calls,
              COALESCE(SUM(bytes_returned), 0) AS bytes_returned
       FROM tool_calls WHERE session_id = ?`),t(n.getToolCallByTool,`SELECT tool, calls, bytes_returned
       FROM tool_calls WHERE session_id = ? ORDER BY calls DESC`),t(n.getEventBytesSummary,`SELECT COALESCE(SUM(bytes_avoided), 0) AS bytes_avoided,
              COALESCE(SUM(bytes_returned), 0) AS bytes_returned
       FROM session_events WHERE session_id = ?`)}insertEvent(t,e,s="PostToolUse",i,o){let a=v("sha256").update(e.data).digest("hex").slice(0,16).toUpperCase(),u=String(i?.projectDir??e.project_dir??"").trim(),d=String(i?.source??e.attribution_source??"unknown"),c=Number(i?.confidence??e.attribution_confidence??0),T=Number.isFinite(c)?Math.max(0,Math.min(1,c)):0,m=y(o?.bytesAvoided),g=y(o?.bytesReturned),h=this.db.transaction(()=>{if(this.stmt(n.checkDuplicate).get(t,U,e.type,a))return;this.stmt(n.getEventCount).get(t).cnt>=I&&this.stmt(n.evictLowestPriority).run(t),this.stmt(n.insertEvent).run(t,e.type,e.category,e.priority,e.data,u,d,T,m,g,s,a),this.stmt(n.updateMetaLastEvent).run(t)});this.withRetry(()=>h())}bulkInsertEvents(t,e,s="PostToolUse",i,o){if(!e||e.length===0)return;if(e.length===1){this.insertEvent(t,e[0],s,i?.[0],o?.[0]);return}let a=e.map((d,c)=>{let T=v("sha256").update(d.data).digest("hex").slice(0,16).toUpperCase(),m=i?.[c],g=String(m?.projectDir??d.project_dir??"").trim(),h=String(m?.source??d.attribution_source??"unknown"),b=Number(m?.confidence??d.attribution_confidence??0),N=Number.isFinite(b)?Math.max(0,Math.min(1,b)):0,A=o?.[c],B=y(A?.bytesAvoided),k=y(A?.bytesReturned);return{event:d,dataHash:T,projectDir:g,attributionSource:h,attributionConfidence:N,bytesAvoided:B,bytesReturned:k}}),u=this.db.transaction(()=>{let d=this.stmt(n.getEventCount).get(t).cnt;for(let c of a)this.stmt(n.checkDuplicate).get(t,U,c.event.type,c.dataHash)||(d>=I?this.stmt(n.evictLowestPriority).run(t):d++,this.stmt(n.insertEvent).run(t,c.event.type,c.event.category,c.event.priority,c.event.data,c.projectDir,c.attributionSource,c.attributionConfidence,c.bytesAvoided,c.bytesReturned,s,c.dataHash));this.stmt(n.updateMetaLastEvent).run(t)});this.withRetry(()=>u())}getEvents(t,e){let s=e?.limit??1e3,i=e?.type,o=e?.minPriority;return i&&o!==void 0?this.stmt(n.getEventsByTypeAndPriority).all(t,i,o,s):i?this.stmt(n.getEventsByType).all(t,i,s):o!==void 0?this.stmt(n.getEventsByPriority).all(t,o,s):this.stmt(n.getEvents).all(t,s)}getEventCount(t){return this.stmt(n.getEventCount).get(t).cnt}getEventBytesSummary(t){let e=this.stmt(n.getEventBytesSummary).get(t);return{bytesAvoided:Number(e?.bytes_avoided??0),bytesReturned:Number(e?.bytes_returned??0)}}getLatestAttributedProjectDir(t){return this.stmt(n.getLatestAttributedProject).get(t)?.project_dir||null}searchEvents(t,e,s,i){try{let o=t.replace(/[%_]/g,u=>"\\"+u),a=i??null;return this.stmt(n.searchEvents).all(s,o,o,a,a,e)}catch{return[]}}ensureSession(t,e){this.stmt(n.ensureSession).run(t,e)}getSessionStats(t){return this.stmt(n.getSessionStats).get(t)??null}incrementCompactCount(t){this.stmt(n.incrementCompactCount).run(t)}upsertResume(t,e,s){this.stmt(n.upsertResume).run(t,e,s??0)}getResume(t){return this.stmt(n.getResume).get(t)??null}markResumeConsumed(t){this.stmt(n.markResumeConsumed).run(t)}claimLatestUnconsumedResume(t){let e=this.stmt(n.claimLatestUnconsumedResume).get(t);return e?{sessionId:e.session_id,snapshot:e.snapshot}:null}getLatestSessionId(){try{return this.db.prepare("SELECT session_id FROM session_meta ORDER BY started_at DESC LIMIT 1").get()?.session_id??null}catch{return null}}incrementToolCall(t,e,s=0){let i=Number.isFinite(s)&&s>0?Math.round(s):0;try{this.stmt(n.incrementToolCall).run(t,e,i)}catch{}}getToolCallStats(t){try{let e=this.stmt(n.getToolCallTotals).get(t),s=this.stmt(n.getToolCallByTool).all(t),i={};for(let o of s)i[o.tool]={calls:o.calls,bytesReturned:o.bytes_returned};return{totalCalls:e?.calls??0,totalBytesReturned:e?.bytes_returned??0,byTool:i}}catch{return{totalCalls:0,totalBytesReturned:0,byTool:{}}}}deleteSession(t){this.db.transaction(()=>{this.stmt(n.deleteEvents).run(t),this.stmt(n.deleteResume).run(t),this.stmt(n.deleteMeta).run(t)})()}cleanupOldSessions(t=7){let e=`-${t}`,s=this.stmt(n.getOldSessions).all(e);for(let{session_id:i}of s)this.deleteSession(i);return s.length}};export{M as SessionDB,ct as _resetWorktreeSuffixCacheForTests,at as getWorktreeSuffix};
