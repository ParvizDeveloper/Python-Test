'use client';

import { useEffect, useRef, useState } from 'react';
import { MC, OP, CD, nrm } from './data';

const STARTER = CD.map((c) => `def ${c.f}(${c.a}):\n    # ваш код\n    `);
const TOTAL = MC.length + OP.length + CD.length;

function Fmt({ s }) {
  return s.split(/`([^`]+)`/).map((p, i) => (i % 2 ? <code key={i}>{p}</code> : p));
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.onload = resolve;
    el.onerror = () => reject(new Error('Не удалось загрузить ' + src));
    document.body.appendChild(el);
  });
}

function readFile(x) {
  const Sk = window.Sk;
  if (Sk.builtinFiles === undefined || Sk.builtinFiles.files[x] === undefined)
    throw "File not found: '" + x + "'";
  return Sk.builtinFiles.files[x];
}

async function runPy(code) {
  const Sk = window.Sk;
  let out = '';
  Sk.configure({ output: (t) => { out += t; }, read: readFile, __future__: Sk.python3 });
  await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, code, true));
  return out;
}

async function runTask(i, user) {
  const c = CD[i];
  if (typeof window === 'undefined' || !window.Sk) {
    return { p: 0, n: c.T.length, lines: [{ ok: false, text: 'Проверяющий модуль Python ещё не загрузился. Подождите секунду и повторите.' }] };
  }
  const lines = [];
  let p = 0;
  for (const [expr, exp] of c.T) {
    let got;
    try {
      got = (await runPy(user + '\nprint(' + expr + ')')).replace(/\n$/, '');
    } catch (e) {
      lines.push({ ok: false, text: `✗ ${expr}: ${(e.toString().split('\n')[0] || 'ошибка')}` });
      continue;
    }
    if (got === exp) {
      p++;
      lines.push({ ok: true, text: `✓ ${expr} → ${got}` });
    } else {
      lines.push({ ok: false, text: `✗ ${expr}: ожидалось ${exp}, получено ${got}` });
    }
  }
  return { p, n: c.T.length, lines };
}

const initial = () => ({
  mc: Array(MC.length).fill(null),
  op: Array(OP.length).fill(''),
  code: [...STARTER],
});

export default function Page() {
  const [ans, setAns] = useState(initial);
  const [outs, setOuts] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const resRef = useRef(null);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        if (!window.Sk) {
          await loadScript('/skulpt/skulpt.min.js');
          await loadScript('/skulpt/skulpt-stdlib.js');
        }
        if (!dead) setReady(true);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { dead = true; };
  }, []);

  const answered =
    ans.mc.filter((v) => v !== null).length +
    ans.op.filter((v) => v.trim()).length +
    ans.code.filter((c) => c.replace(/#.*$/gm, '').trim().split('\n').length > 1).length;

  const setMc = (i, j) => setAns((a) => ({ ...a, mc: a.mc.map((v, k) => (k === i ? j : v)) }));
  const setOp = (i, v) => setAns((a) => ({ ...a, op: a.op.map((x, k) => (k === i ? v : x)) }));
  const setCode = (i, v) => setAns((a) => ({ ...a, code: a.code.map((x, k) => (k === i ? v : x)) }));

  async function runOne(i) {
    setOuts((o) => ({ ...o, [i]: { running: true } }));
    const r = await runTask(i, ans.code[i]);
    setOuts((o) => ({ ...o, [i]: r }));
  }

  async function finish() {
    setBusy(true);
    const mc = MC.filter((m, i) => ans.mc[i] === m[2]).length;
    const op = OP.filter((o, i) => {
      const f = nrm[o[2]];
      return ans.op[i].trim() && o[1].some((a) => f(a) === f(ans.op[i]));
    }).length;
    let cd = 0;
    const all = {};
    for (let i = 0; i < CD.length; i++) {
      const r = await runTask(i, ans.code[i]);
      if (r.p === r.n) cd++;
      all[i] = r;
    }
    setOuts(all);
    setResult({ mc, op, cd });
    setBusy(false);
    setTimeout(() => resRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  function reset() {
    if (!confirm('Сбросить все ответы?')) return;
    setAns(initial());
    setOuts({});
    setResult(null);
    window.scrollTo({ top: 0 });
  }

  const checked = result !== null;
  const t = checked ? result.mc + result.op + result.cd : 0;
  const pc = Math.round((t / TOTAL) * 100);
  const msg = pc >= 85 ? 'Отличный результат! 🔥' : pc >= 60 ? 'Хорошо, но есть что повторить.' : 'Стоит ещё раз пройтись по конспектам.';

  return (
    <div className="w">
      <h1>🐍 Тест по Python</h1>
      <p className="sub">
        От основ синтаксиса до коллекций, рекурсии и алгоритмов. Задания в каждой части усложняются постепенно.
        {' '}Всего {TOTAL} заданий: {MC.length} с вариантами, {OP.length} открытых, {CD.length} с написанием кода.
      </p>
      <div className="bar">
        <div><i style={{ width: `${(answered / TOTAL) * 100}%` }} /></div>
        <small>Отвечено: {answered} из {TOTAL}</small>
      </div>

      <h2>Часть 1. Закрытые вопросы ({MC.length})</h2>
      {MC.map((m, i) => (
        <div className="q" key={i}>
          <p><b>{i + 1}.</b> <Fmt s={m[0]} /></p>
          {m[1].map((o, j) => {
            let cls = '';
            if (checked) cls = j === m[2] ? 'ok' : ans.mc[i] === j ? 'bad' : '';
            return (
              <label key={j} className={cls}>
                <input type="radio" name={`m${i}`} checked={ans.mc[i] === j} onChange={() => setMc(i, j)} />{' '}
                <span>{'abcd'[j]})</span>{o}
              </label>
            );
          })}
        </div>
      ))}

      <h2>Часть 2. Открытые вопросы ({OP.length})</h2>
      {OP.map((o, i) => {
        const f = nrm[o[2]];
        const ok = ans.op[i].trim() && o[1].some((a) => f(a) === f(ans.op[i]));
        return (
          <div className="q" key={i}>
            <p><b>{MC.length + 1 + i}.</b> <Fmt s={o[0]} /></p>
            <input type="text" autoComplete="off" placeholder="Ваш ответ" value={ans.op[i]} onChange={(e) => setOp(i, e.target.value)} />
            {checked && (
              <div className="fb">
                {ok ? <span className="ok-t">✓ Верно</span> : <span className="bad-t">✗ Верный ответ: {o[1][0]}</span>}
              </div>
            )}
          </div>
        );
      })}

      <h2>Часть 3. Напишите код ({CD.length})</h2>
      <p className="sub">Код проверяется автоматически на нескольких тестах. Можно проверять сколько угодно раз.</p>
      {CD.map((c, i) => {
        const o = outs[i];
        return (
          <div className="q" key={i}>
            <p><b>{MC.length + OP.length + 1 + i}.</b> <Fmt s={c.t} /></p>
            <textarea
              spellCheck={false}
              value={ans.code[i]}
              onChange={(e) => setCode(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const el = e.target;
                  el.setRangeText('    ', el.selectionStart, el.selectionEnd, 'end');
                  setCode(i, el.value);
                }
              }}
            />
            <div className="row" style={{ marginTop: 8 }}>
              <button className="g" disabled={!ready || (o && o.running)} onClick={() => runOne(i)}>
                {ready ? 'Запустить тесты' : 'Загрузка Python…'}
              </button>
            </div>
            {o && (
              <div className="out">
                {o.running ? 'Проверяю…' : o.lines.map((l, k) => (
                  <div key={k} className={l.ok ? 'ok-t' : 'bad-t'}>{l.text}</div>
                ))}
                {!o.running && o.p === o.n && <b className="ok-t">Все тесты пройдены!</b>}
              </div>
            )}
          </div>
        );
      })}

      <div className="row">
        <button onClick={finish} disabled={busy || !ready}>
          {busy ? 'Проверяю…' : checked ? 'Проверить ещё раз' : 'Завершить и проверить'}
        </button>
        <button className="g" onClick={reset}>Начать заново</button>
      </div>

      {checked && (
        <div id="res" ref={resRef}>
          <b className="big">{t} / {TOTAL}</b> ({pc}%)
          <p>{msg}</p>
          <p className="sub">
            Закрытые: {result.mc}/{MC.length} · Открытые: {result.op}/{OP.length} · Код: {result.cd}/{CD.length}
            <br />
            Верные варианты подсвечены зелёным, ошибки красным. Для заданий с кодом показаны результаты тестов.
          </p>
        </div>
      )}
    </div>
  );
}
