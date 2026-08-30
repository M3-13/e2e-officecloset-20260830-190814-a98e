# Glamouröser Kleiderschrank-Manager

Ein glamouröser Kleiderschrank-Manager im Hollywood-Stil mit Web-GUI. Benutzer
registrieren sich und melden sich an, legen Kleidungsstücke mit Bildern und
Kategorien an, durchstöbern ihre Garderobe und kombinieren im Outfit-Creator
Einzelteile zu gespeicherten Outfits – alles in eleganter Red-Carpet-Optik.

## Tech-Stack

- **Backend:** Python (FastAPI) + Uvicorn
- **Auth:** JWT (Bearer) + Passwort-Hashing (Argon2)
- **Datenbank:** SQLite (via SQLAlchemy)
- **Frontend:** Vite + React

## Installation

```bash
cd backend
py -m pip install -r requirements.txt
```

## Starten (Entwicklung)

```bash
cd backend
# JWT-Signatur-Geheimnis einmal erzeugen und exportieren (siehe .env.example):
export JWT_SECRET=$(py -c "import secrets; print(secrets.token_hex(32))")
py -m uvicorn app.main:app --port 8000
```

Beim Start werden die Datenbank-Tabellen automatisch angelegt. Das Backend
verwendet standardmäßig eine SQLite-Datei `backend/wardrobe.db` und erlaubt als
CORS-Origin `http://localhost:5173`. Die Werte lassen sich über die
Umgebungsvariablen `DATABASE_URL`, `JWT_SECRET` und `CORS_ORIGIN` überschreiben;
eine Vorlage liegt in `.env.example` (siehe auch `RUN.json`).

## API-Endpunkte

Alle Endpunkte liegen unter `/api`. Geschützte Endpunkte erwarten
`Authorization: Bearer <JWT>`.

| Methode | Pfad                        | Beschreibung                        | Auth |
|---------|-----------------------------|-------------------------------------|------|
| GET     | `/api/health`               | Health-Check (`{"status":"ok"}`)    | –    |
| POST    | `/api/auth/register`        | Registrierung `{email,password}`    | –    |
| POST    | `/api/auth/login`           | Login `{email,password}`            | –    |
| GET     | `/api/auth/me`              | Eigenes Profil                      | ✓    |
| POST    | `/api/auth/logout`          | Abmelden                            | ✓    |
| DELETE  | `/api/auth/account`         | Konto inkl. Daten löschen           | ✓    |
| GET     | `/api/wardrobe/items`       | Eigene Kleidungsstücke auflisten    | ✓    |
| POST    | `/api/wardrobe/items`       | Kleidungsstück anlegen (multipart)  | ✓    |
| GET     | `/api/wardrobe/items/{id}`  | Ein Kleidungsstück                  | ✓    |
| PATCH   | `/api/wardrobe/items/{id}`  | Kleidungsstück bearbeiten           | ✓    |
| DELETE  | `/api/wardrobe/items/{id}`  | Kleidungsstück löschen              | ✓    |
| GET     | `/api/outfits`              | Eigene Outfits auflisten             | ✓    |
| POST    | `/api/outfits`              | Outfit anlegen `{name,item_ids}`    | ✓    |
| GET     | `/api/outfits/{id}`         | Ein Outfit                           | ✓    |
| PATCH   | `/api/outfits/{id}`         | Outfit bearbeiten                    | ✓    |
| DELETE  | `/api/outfits/{id}`         | Outfit löschen                       | ✓    |

Hochgeladene Bilder liegen unter `/uploads/<datei>`.

## Features

- Registrierung und Login mit JWT-Authentifizierung
- Garderobe: Kleidungsstücke anlegen, filtern, bearbeiten und löschen (inkl. Bild-Upload)
- Outfit-Creator: Kleidungsstücke kombinieren, benennen und speichern
- Besitzprüfung: jede Nutzerin sieht und verwaltet nur ihre eigenen Daten
- Konto-Löschung inkl. aller verknüpften Daten
- Red-Carpet-Optik nach den Design-Tokens in `DESIGN.md`
