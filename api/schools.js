// 교육청 학교 검색 (나이스 교육정보 개방 포털의 학교기본정보)
// Vercel 환경 변수 NEIS_KEY 에 인증키를 넣으면 최대 100곳, 없으면 나이스 제한으로 5곳까지만 나옵니다.
// 인증키는 코드에 적지 않습니다.
const SIDO = [['서울', '서울'], ['부산', '부산'], ['대구', '대구'], ['인천', '인천'], ['대전', '대전'], ['울산', '울산'], ['세종', '세종'], ['경기', '경기'], ['강원', '강원'],
  ['충청북', '충북'], ['충청남', '충남'], ['전북', '전북'], ['전라북', '전북'], ['전라남', '전남'], ['경상북', '경북'], ['경상남', '경남'], ['제주', '제주'], ['광주', '광주']];

function sidoOf(name) {
  const n = String(name || '');
  if (n.startsWith('전남광주')) return n.includes('(광주)') ? '광주' : n.includes('(전남)') ? '전남' : null;
  const hit = SIDO.find(([head]) => n.startsWith(head));
  return hit ? hit[1] : null;
}

function toSchool(r) {
  const code = String(r.SD_SCHUL_CODE || '').trim(), office = String(r.ATPT_OFCDC_SC_CODE || '').trim();
  const sido = sidoOf(r.LCTN_SC_NM), name = String(r.SCHUL_NM || '').trim();
  if (!/^\d{7}$/.test(code) || !/^[A-Z]\d{2}$/.test(office) || !sido || !name) return null; // 개교 전(코드 없음)·재외학교 제외
  const address = String(r.ORG_RDNMA || '').trim().replace(/\s+/g, ' ');
  const gu = sido === '세종' ? '세종시' : (address.split(' ')[1] || '');
  if (!gu) return null;
  const kind = String(r.SCHUL_KND_SC_NM || '');
  return { code: office + '-' + code, name, sido, gu, level: ['초등학교', '중학교', '고등학교'].includes(kind) ? kind : '기타', address };
}

module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const q = (url.searchParams.get('q') || '').trim();
  const send = (status, body, cache) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', cache || 'no-store');
    res.end(JSON.stringify(body));
  };
  if (req.method !== 'GET') return send(405, { ok: false, msg: '지원하지 않는 요청이에요.' });
  if (q.length < 2 || q.length > 30) return send(400, { ok: false, msg: '학교 이름을 2자 이상 입력해 주세요.' });

  const key = process.env.NEIS_KEY || '';
  const params = new URLSearchParams({ Type: 'json', pIndex: '1', pSize: '100', SCHUL_NM: q });
  if (key) params.set('KEY', key);
  try {
    const r = await fetch('https://open.neis.go.kr/hub/schoolInfo?' + params, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error('neis ' + r.status);
    const j = await r.json();
    if (!j.schoolInfo) {
      if (j.RESULT && j.RESULT.CODE === 'INFO-200') return send(200, { ok: true, rows: [], more: false }, 's-maxage=3600');
      throw new Error('neis ' + (j.RESULT && j.RESULT.CODE));
    }
    const total = j.schoolInfo[0].head[0].list_total_count, raw = j.schoolInfo[1].row;
    return send(200, { ok: true, rows: raw.map(toSchool).filter(Boolean), more: total > raw.length }, 's-maxage=86400');
  } catch (e) {
    console.error(e.message);
    return send(502, { ok: false, msg: '교육청 학교 정보를 불러오지 못했어요. 잠시 뒤 다시 해 주세요.' });
  }
};
