import urllib.request, urllib.error, json, time, uuid

BASE = 'http://127.0.0.1:8000/api/v1'

def req(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body else None
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    r = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            raw = resp.read()
            try: return resp.status, json.loads(raw)
            except: return resp.status, {"_raw": raw.decode(errors="replace")}
    except urllib.error.HTTPError as e:
        raw = e.read()
        try: return e.code, json.loads(raw)
        except: return e.code, {"_raw": raw.decode(errors="replace")}

EMAIL = f"smoke_{uuid.uuid4().hex[:8]}@test.com"
OK = '[OK]'; FAIL = '[FAIL]'
passed = 0; failed = 0

def check(cond, label, extra=''):
    global passed, failed
    mark = OK if cond else FAIL
    print(f'{mark} {label}' + (f' | {extra}' if extra else ''))
    if cond: passed += 1
    else: failed += 1

# 10.1 register
s, b = req('POST', '/auth/register', {'nombre':'Test','apellido':'User','email':''+EMAIL+'','password':'password123'})
ok = s == 201 and 'access_token' in b and 'refresh_token' in b
ACCESS, REFRESH = b.get('access_token',''), b.get('refresh_token','')
check(ok, f'10.1 register -> {s}', f'tokens presentes: {ok}')
if not ok: print(f'     body: {b}')

# 10.2 login valido
s, b = req('POST', '/auth/login', {'email':''+EMAIL+'','password':'password123'})
ok = s == 200 and 'access_token' in b
ACCESS2, REFRESH2 = b.get('access_token',''), b.get('refresh_token','')
check(ok, f'10.2 login valido -> {s}')
if not ok: print(f'     body: {b}')

# 10.3 login invalido — sin hint de campo
s, b = req('POST', '/auth/login', {'email':''+EMAIL+'','password':'wrongpass'})
detail = b.get('detail','')
no_hint = not any(w in detail.lower() for w in ['email','password','contrasena','campo'])
check(s == 401 and no_hint, f'10.3 login invalido -> {s}', f'sin hint: {no_hint} | "{detail}"')

# 10.4 GET /me — sin password_hash
s, b = req('GET', '/auth/me', token=ACCESS)
ok = s == 200 and 'password_hash' not in b and 'roles' in b
check(ok, f'10.4 GET /me -> {s}', f'roles={b.get("roles")} sin pw_hash={("password_hash" not in b)}')
if not ok: print(f'     body: {b}')

# 10.5 refresh — nuevo par emitido; la verificación del viejo va en 10.7
s, b = req('POST', '/auth/refresh', {'refresh_token': REFRESH})
ok = s == 200 and 'access_token' in b
REFRESH3, ACCESS3 = b.get('refresh_token',''), b.get('access_token','')
check(ok, f'10.5 refresh -> {s}', f'nuevo par emitido: {ok}')
if not ok: print(f'     body: {b}')

# 10.6 logout
s, _ = req('POST', '/auth/logout', {'refresh_token': REFRESH3}, token=ACCESS3)
s_r, _ = req('POST', '/auth/refresh', {'refresh_token': REFRESH3})
check(s == 204 and s_r == 401, f'10.6 logout -> {s}', f'token revocado en BD: {s_r == 401}')

# 10.7 replay attack
s, _ = req('POST', '/auth/refresh', {'refresh_token': REFRESH})
s_r2, _ = req('POST', '/auth/refresh', {'refresh_token': REFRESH2})
check(s == 401 and s_r2 == 401, f'10.7 replay attack -> {s}', f'todos revocados: {s_r2 == 401}')

# 10.8 rate limit
triggered = False
for i in range(7):
    s, _ = req('POST', '/auth/login', {'email':'noexiste@test.com','password':'bad'})
    if s == 429:
        check(True, f'10.8 rate limit -> 429 en intento #{i+1}')
        triggered = True
        break
if not triggered:
    check(False, '10.8 rate limit', 'no se disparo 429 en 7 intentos')

print(f'\nResultado: {passed} OK, {failed} FAIL')
