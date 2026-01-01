# Migrace z Neon do Supabase - Kompletní Balíček

Tento balíček obsahuje vše potřebné pro migraci databáze GameOnBaby z Neon PostgreSQL do Supabase.

---

## 📦 Co je v tomto balíčku?

1. **`supabase_migration_guide.md`** - Podrobný průvodce migrací v češtině
2. **`schema.sql`** - Kompletní SQL schéma databáze připravené pro Supabase
3. **`export_from_neon.js`** - Skript pro export dat z Neon databáze
4. **`MIGRATION_README.md`** - Tento soubor (přehled)

---

## 🎯 Rychlý start (3 kroky)

### Krok 1: Export dat z Neonu
```bash
# Spusť export script
node export_from_neon.js

# Tím se vytvoří soubor: neon_data_export.sql
```

### Krok 2: Import do Supabase
1. Otevři [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
2. Nejprve spusť `schema.sql` (vytvoří tabulky)
3. Pak spusť `neon_data_export.sql` (importuje data)

### Krok 3: Aktualizace konfigurace
```bash
# Uprav .env soubor s novou Supabase URL
DATABASE_URL="postgresql://postgres:[HESLO]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

---

## 📋 Přehled databázových tabulek

### Auth tabulky (NextAuth.js)
- **Account** - Uživatelské účty z OAuth
- **Session** - Relace uživatelů
- **User** - Uživatelé aplikace
- **VerificationToken** - Tokeny pro ověření emailu

### Aplikační tabulky
- **Event** - Akce/události
- **Registration** - Registrace na akce
- **WaitingList** - Čekací listina
- **Payment** - Platby
- **RegistrationHistory** - Historie změn registrací
- **NoShow** - Záznamy o nepříchodech

### Test tabulka
- **playing_with_neon** - Testovací data (může být smazána)

---

## 🔑 Klíčové vlastnosti schématu

### Enum Types
```sql
-- Role uživatelů
UserRole: USER, REGULAR, MODERATOR, ADMIN

-- Akce v historii registrací
RegistrationAction: REGISTERED, UNREGISTERED, MOVED_TO_WAITLIST, 
                  MOVED_FROM_WAITLIST, DELETED_BY_MODERATOR,
                  EVENT_CREATED, EVENT_DELETED, EVENT_UPDATED, REACTIVATED
```

### Indexy pro výkon
- ✅ Optimalizované pro nejčastější dotazy
- ✅ Indexy pro email lookups
- ✅ Indexy pro timestamp queries
- ✅ Indexy pro event_id + created_at

### Foreign Key Constraints
- ✅ CASCADE delete pro Account/Session při smazání User
- ✅ CASCADE delete pro Payment při smazání Registration
- ✅ RESTRICT pro Registration/WaitingList při smazání Event

---

## ⚠️ Před migrací

### 1. Záloha
```bash
# Průběžná záloha by měla existovat (backup_before_migration.sql)
# Pokud ne, vytvoř ji v Neon Dashboard
```

### 2. Kontrola dat
```bash
# Zjisti kolik dat máš
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

Promise.all([
  prisma.user.count(),
  prisma.event.count(),
  prisma.registration.count(),
]).then(([users, events, regs]) => {
  console.log(\`Users: \${users}, Events: \${events}, Registrations: \${regs}\`);
  prisma.\$disconnect();
});
"
```

### 3. Vytvoření Supabase projektu
- [ ] Navštiv [Supabase Dashboard](https://supabase.com/dashboard)
- [ ] Vytvoř nový projekt "gameonbaby"
- [ ] Zvol EU Central region (pro lepší latenci)
- [ ] Počkej na vytvoření (2-3 minuty)

---

## 🚀 Proces migrace

### Fáze 1: Export (5-10 minut)
1. ✅ Spusť `node export_from_neon.js`
2. ✅ Zkontroluj vytvořený soubor `neon_data_export.sql`
3. ✅ Ověř velikost souboru (malý = málo dat, velký = hodně dat)

### Fáze 2: Import schématu (3-5 minut)
1. ✅ V Supabase Dashboard → SQL Editor
2. ✅ Otevři `schema.sql`
3. ✅ Zkopíruj a spusť
4. ✅ Ověř, že se vytvořily všechny tabulky

### Fáze 3: Import dat (5-15 minut)
1. ✅ V Supabase Dashboard → SQL Editor
2. ✅ Otevři `neon_data_export.sql`
3. ✅ Zkopíruj a spusť
4. ✅ Počkej na dokončení

### Fáze 4: Konfigurace (5 minut)
1. ✅ Uprav `.env` soubor s novou DATABASE_URL
2. ✅ Aktualizuj Vercel Environment Variables
3. ✅ Test lokální vývoj: `npm run dev`

### Fáze 5: Ověření (10 minut)
1. ✅ Otestuj přihlášení
2. ✅ Zkontroluj zobrazení akcí
3. ✅ Test registrace
4. ✅ Zkontroluj admin dashboard

---

## 🔍 Ověření po migraci

### Kontrola počtu záznamů
```bash
# Porovnej počty v Neon a Supabase
# V Supabase Dashboard → Table Editor → Count
```

### Kontrola dat
- [ ] Všichni uživatelé jsou přítomni
- [ ] Všechny akce jsou přítomny
- [ ] Registrace jsou kompletní
- [ ] Platební údaje jsou správné
- [ ] Historie registrací je kompletní

---

## ⚙️ Řešení problémů

### Problém: Chyba při importu schématu
**Řešení:**
- Zkontroluj, zda máš správnou verzi Supabase (PostgreSQL 15+)
- Smaž existující tabulky a znovu spusť schema.sql

### Problém: Chyba při importu dat
**Řešení:**
- Ujisti se, že schéma je správně nainstalováno
- Zkontroluj logy v Supabase Dashboard
- Pokud je SQL příliš velký, rozděl ho na menší části

### Problém: Missing columns nebo wrong types
**Řešení:**
- Porovnej `schema.sql` s aktuálním Prisma schématem
- Spusť `npx prisma db pull` v Supabase pro ověření
- Aktualizuj schéma podle potřeby

### Problém: Aplikace nefunguje
**Řešení:**
- Zkontroluj DATABASE_URL v `.env`
- Ověř, že máš přístup k Supabase
- Zkontroluj browser konzoli pro chyby
- Restart vývojového serveru

---

## 📊 Časový odhad

| Fáze | Čas |
|-------|------|
| Export dat z Neonu | 5-10 min |
| Import schématu do Supabase | 3-5 min |
| Import dat do Supabase | 5-15 min |
| Konfigurace | 5 min |
| Ověření | 10 min |
| **Celkem** | **30-45 min** |

---

## 🎓 Dodatečné zdroje

### Dokumentace
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don't_Do_This)

### Nástroje
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Neon Dashboard](https://console.neon.tech)
- [Prisma Studio](https://www.prisma.io/docs/concepts/components/prisma-studio)

---

## ✅ Checklist před migrací

- [ ] Záloha Neon databáze vytvořena
- [ ] Export script otestován
- [ ] Supabase projekt vytvořen
- [ ] Connection string získán
- [ ] Tým informován o plánované migraci (pokud relevantní)
- [ ] Časová okno pro migraci naplánováno

---

## ✅ Checklist po migraci

- [ ] Všechna data exportována
- [ ] Všechna data importována
- [ ] Počty záznamů se shodují
- [ ] Aplikace funguje s novou databází
- [ ] Všechny testy prošly
- [ ] Performance je uspokojivá
- [ ] Vercel nasazení úspěšné
- [ ] Starý Neon projekt deaktivován

---

## 📞 Podpora

Pokud narazíš na problémy:

1. **Supabase Support**: [https://supabase.com/support](https://supabase.com/support)
2. **Prisma Issues**: [GitHub Discussions](https://github.com/prisma/prisma/discussions)
3. **Problém s tímto balíčkem**: Otevři issue v GitHub repozitáři

---

## 🔄 Rolling back

Pokud se migrace nepovede:

1. Uprav `.env` zpět na Neon DATABASE_URL
2. Vercel automaticky použije starou databázi
3. Data v Neon zůstávají nedotčena

**Poznámka:** Tento proces je bezpečný - Neon data nejsou mazána.

---

## 🎉 Příprava hotova!

Nyní jsi připraven k migraci. Postupuj podle `supabase_migration_guide.md` pro detailní pokyny.

**Hodně štěstí! 🚀**

---

## 📝 Poznámky

- Tento balíček byl automaticky vygenerován z Prisma schématu
- Všechny foreign keys, indexy a constraints jsou zachovány
- Migrace je reverzibilní
- Žádná data nejsou ztracena během procesu

---

**Verze balíčku:** 1.0  
**Datum generování:** 2026-01-01  
**Verze Prisma:** 5.20.0 (aktualizovat na 7.2.0 doporučeno)
