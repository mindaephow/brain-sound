# 등록 화면(brainsound-register.html)을 대회 페이지 안에 넣는 스크립트.
# register.html을 고칠 때마다 이 파일을 다시 실행하세요:  python embed_register.py
import json, re
import os; d = os.path.dirname(os.path.abspath(__file__)) + os.sep
reg = open(d + 'brainsound-register.html', encoding='utf-8').read()
c = open(d + 'brainsound-contest.html', encoding='utf-8').read()
js = json.dumps(reg, ensure_ascii=False).replace('</', r'<\/')
block = '/*REG_BEGIN*/const REG_HTML = ' + js + ';/*REG_END*/'
if '/*REG_BEGIN*/' in c:
    c = re.sub(r'/\*REG_BEGIN\*/.*?/\*REG_END\*/', lambda m: block, c, flags=re.S)
else:
    c = c.replace('// 상단 메뉴·버튼의 #이동을 직접 처리', block + '\n// 상단 메뉴·버튼의 #이동을 직접 처리', 1)
open(d + 'brainsound-contest.html', 'w', encoding='utf-8').write(c)
print('ok', len(c))
