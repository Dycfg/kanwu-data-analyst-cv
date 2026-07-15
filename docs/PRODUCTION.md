# Production runbook

This project is deployed on the Tencent Cloud Ubuntu server and served through Nginx.

## Paths

- App directory: `/home/ubuntu/kanwu-data-analyst-cv`
- Runtime data: `/home/ubuntu/kanwu-data-analyst-cv/.data`
- Environment file: `/home/ubuntu/kanwu-data-analyst-cv/.env`
- Systemd service: `kanwu-cv`
- Domain: `kanwu.pw`

## Deploy an update

Run these commands on the server after pushing changes to GitHub:

```bash
cd ~/kanwu-data-analyst-cv
git pull
npm install
npm run build
sudo systemctl restart kanwu-cv
sudo systemctl status kanwu-cv --no-pager
curl -I http://127.0.0.1:3000
curl -I https://kanwu.pw
```

## Back up data

The admin database and uploaded CV files live in `.data`. Back them up before risky updates:

```bash
cd ~/kanwu-data-analyst-cv
bash scripts/backup-data.sh
```

Backups are written to:

```text
/home/ubuntu/kanwu-backups
```

The script keeps the newest 14 days by default. Override with:

```bash
KEEP_DAYS=30 bash scripts/backup-data.sh
```

## Restore a backup

Stop the app, replace `.data` and `.env`, then restart:

```bash
cd ~/kanwu-data-analyst-cv
sudo systemctl stop kanwu-cv
tar -xzf ~/kanwu-backups/kanwu-data-YYYYMMDD-HHMMSS.tar.gz -C .
sudo systemctl start kanwu-cv
```

## Security checklist

- Change the initial admin password after the first production login.
- Keep TCP 80 and 443 open for the website.
- Keep SSH access limited when possible.
- Back up `.data` before code updates.
- Review `/admin` audit logs after CV uploads, content edits, or user changes.
- Failed admin login attempts are locked after repeated failures.
