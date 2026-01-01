# Migrace z Neon do Supabase

## Přehled
Tento dokument obsahuje kompletní průvodce pro migraci databáze z Neon PostgreSQL do Supabase.

## Co obsahuje tento balíček
1. `schema.sql` - kompletní SQL schéma databáze
2. `export_data.sql` - skript pro export dat z Neonu
3. `import_data.sql` - skript pro import dat do Supabase

---

## Krok 1: Příprava v Supabase

### 1.1 Vytvoření projektu
1. Otevři [Supabase Dashboard](https://supabase.com/dashboard)
2. Klikni na "New Project"
3. Zadej název projektu (např. "gameonbaby")
4. Zvol region (doporučuji: EU Central nebo blízko tvé lokality)
5. Vytvoř silné heslo pro databázi
6. Počkej na vytvoření projektu (obvykle 2-3 minuty)

### 1.2 Získání Connection String
1. V Supabase Dashboard → Project Settings → Database
2. Najdi sekci "Connection String"
3. Zkopíruj "Connection pooling" URL (bude vypadat takto):
   ```
   postgresql://postgres:[TVO-HESLO]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
4. Ulož tento connection string do `.env` souboru:
   ```
   DATABASE_URL="postgresql://postgres:[TVO-HESLO]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
   ```

---

## Krok 2: Import schématu do Supabase

### 2.1 Použití Supabase SQL Editoru
1. Otevři Supabase Dashboard
2. Jdi na "SQL Editor"
3. Klikni na "New query"
4. Otevři soubor `schema.sql` z tohoto balíčku
5. Zkopíruj obsah do editoru
6. Klikni "Run"
7. Počkej na dokončení (pár sekund)

### 2.2 Nebo použij Prisma (alternativa)
```bash
# Nastavit Supabase connection string
export DATABASE_URL="postgresql://postgres:[TVO-HESLO]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"

# Aplojovat schéma
npx prisma db push
```

---

## Krok 3: Export dat z Neonu

### 3.1 Spuštění export scriptu
```bash
# V kořenovém adresáři projektu
node export_from_neon.js
```

Tím se vytvoří soubor `neon_data_export.sql` se všemi daty.

### 3.2 Co je exportováno
- Všechny tabulky s daty
- Zachování vazeb mezi tabulkami
- Všechny enum hodnoty
- Indexy a constraints

---

## Krok 4: Import dat do Supabase

### 4.1 Použití Supabase SQL Editoru
1. Otevři Supabase Dashboard → SQL Editor
2. Klikni na "New query"
3. Otevři soubor `neon_data_export.sql`
4. Zkopíruj obsah do editoru
5. Klikni "Run"
6. Počkej na dokončení

### 4.2 Nebo použij příkazovou řádku
```bash
# Pokud máš nainstalované PostgreSQL klienta
psql "postgresql://postgres:[TVO-HESLO]@db.[PROJECT-REF].supabase.co:5432/postgres" < neon_data_export.sql
```

---

## Krok 5: Aktualizace konfigurace

### 5.1 Lokální .env soubor
```bash
# Uprav .env soubor
DATABASE_URL="postgresql://postgres:[TVO-HESLO]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

### 5.2 Vercel Environment Variables
1. Otevři [Vercel Dashboard](https://vercel.com/dashboard)
2. Vyběr projekt "gameonbaby"
3. Jdi na Settings → Environment Variables
4. Najdi `DATABASE_URL`
5. Nahraď hodnotu novou Supabase URL
6. Klikni "Save"

---

## Krok 6: Ověření migrace

### 6.1 Test lokálního vývoje
```bash
# Spusť vývojový server
npm run dev
```

### 6.2 Ověř data v Supabase
1. Otevři Supabase Dashboard → Table Editor
2. Zkontroluj tabulky:
   - User (zkontroluj uživatele)
   - Event (zkontroluj akce)
   - Registration (zkontroluj registrace)
   - WaitingList (zkontroluj čekací listinu)

### 6.3 Test aplikace
1. Otevři http://localhost:3000
2. Přihlaste se
3. Zkontroluj:
   - Zobrazení akcí
   - Registrace na akci
   - Admin dashboard

---

## Krok 7: Výroba v Supabase

### 7.1 Push do Vercel
```bash
git add .
git commit -m "Migrate database from Neon to Supabase"
git push
```

Vercel automaticky nasadí s novou databází.

### 7.2 Monitorování v Supabase
1. Otevři Supabase Dashboard
2. Jdi na "Database" → "Logs"
3. Sleduj výkon a chyby

---

## Časté problémy a řešení

### Problém: Chyba při importu dat
**Řešení:** 
- Ujisti se, že schéma je správně nainstalováno
- Zkontroluj, zda nejsou duplicitní záznamy
- Vymaž tabulky a znovu importuj

### Problém: Timezone rozdíly
**Řešení:**
- Supabase používá UTC timezone
- Neon může používat jinou timezone
- Zkontroluj `prisma/schema.prisma` pro timezone nastavení

### Problém: Enum type errors
**Řešení:**
- Ujisti se, že enum types jsou vytvořeny před importem dat
- V `schema.sql` jsou enum types definovány jako první

### Problém: Foreign key constraints
**Řešení:**
- Importuj tabulky ve správném pořadí (závislosti)
- V `import_data.sql` je pořadí správně nastaveno

---

## Údržba po migraci

### Pravidelné zálohy
1. Supabase Dashboard → Database → Backups
2. Povol automatické zálohy (doporučeno: denně)

### Monitoring
1. Supabase Dashboard → Database → Reports
2. Sleduj pomalé dotazy
3. Optimalizuj indexy podle potřeby

---

## Kontakt pro podporu
Pokud narazíš na problémy:
1. Zkontroluj [Supabase Documentation](https://supabase.com/docs)
2. Zkontroluj [Prisma Documentation](https://www.prisma.io/docs)
3. V případě potřeby se obrať na support

---

## Shrnutí času
- Krok 1: 5 minut
- Krok 2: 3 minuty
- Krok 3: 2 minuty
- Krok 4: 5-10 minut (podle množství dat)
- Krok 5: 5 minut
- Krok 6: 10 minut
- Krok 7: 10 minut

**Celkem:** 40-50 minut

---

## Před migrací - Checklist
- [ ] Vytvořen Supabase projekt
- [ ] Získán Supabase connection string
- [ ] Otestováno připojení k Supabase
- [ ] Vytvořena záloha Neon databáze
- [ ] Informován tým o plánovaném výpadku (pokud relevantní)
- [ ] Testovací prostředí připraveno

---

## Po migraci - Checklist
- [ ] Všechna data úspěšně importována
- [ ] Aplikace funguje s novou databází
- [ ] Všechny testy prošly
- [ ] Performance je uspokojivá
- [ ] Zálohy v Supabase konfigurovány
- [ ] Starý Neon projekt deaktivován (po ověření)

---

## Soubory v tomto balíčku
- `schema.sql` - SQL schéma pro Supabase
- `export_from_neon.js` - Script pro export dat
- `import_data.sql` - SQL pro import dat
- `supabase_migration_guide.md` - tento dokument

---

## Poznámky k migraci
- Tento proces je "downtime-free" - aplikace může běžet během migrace
- Data jsou přesouvána bez ztráty
- Všechny constraints a indexy jsou zachovány
- Migrace je reverzibilní (lze se vrátit k Neon)

---

**Hodně štěstí s migrací! 🚀**
