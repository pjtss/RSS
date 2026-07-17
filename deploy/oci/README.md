# OCI 배포

## 1. 빌드

CI 또는 로컬의 빌드 머신에서 실행합니다.

```bash
npm ci
npm run build
```

OCI에는 다음 항목을 배포합니다.

- `.next/standalone`
- `.next/static` -> `.next/standalone/.next/static`
- `public` -> `.next/standalone/public`
- `scripts/oci-cron.sh`

1GB 인스턴스에서 `next build`를 반복 실행하지 않고, 빌드된 standalone 결과만 배포합니다.

## 2. 환경변수

`/etc/stockman/stockman.env`에 운영 환경변수를 저장합니다. 파일 권한은 `root:stockman`, `640`으로 제한합니다.

필수 값:

```dotenv
NODE_ENV=production
DATABASE_URL=...
CRON_SECRET=...
KIS_APPKEY=...
KIS_APPSECRET=...
US_TURNOVER_RATIO_NEW_DISCORD_WEBHOOK_URL=...
US_TURNOVER_RATIO_INCREASE_DISCORD_WEBHOOK_URL=...
```

현재 프로젝트에서 사용하는 DART, SEC, Web Push 관련 환경변수도 함께 등록합니다.

## 3. 서비스 설치

```bash
sudo useradd --system --home /opt/stockman --shell /usr/sbin/nologin stockman
sudo mkdir -p /opt/stockman/current /etc/stockman
sudo chown -R stockman:stockman /opt/stockman
sudo chmod 640 /etc/stockman/stockman.env
sudo cp deploy/oci/stockman.service /etc/systemd/system/
sudo cp deploy/oci/stockman-cron.service /etc/systemd/system/
sudo cp deploy/oci/stockman-cron.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now stockman.service
sudo systemctl enable --now stockman-cron.timer
```

## 4. Nginx

```bash
sudo cp deploy/oci/nginx-stockman.conf /etc/nginx/conf.d/stockman.conf
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

HTTPS는 OCI 인스턴스 앞에 도메인과 인증서를 연결한 뒤 Certbot 또는 OCI Load Balancer에서 처리합니다.

## 5. 확인

```bash
systemctl status stockman.service
systemctl status stockman-cron.timer
journalctl -u stockman.service -f
journalctl -u stockman-cron.service -f
```
