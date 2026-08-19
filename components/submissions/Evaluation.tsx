import { Icon } from "@/components/ui";
import type { TestGroup, TestStatus as TStatus } from "@/lib/types";

export function TestStatus({ st }: { st: TStatus }) {
  if (st === 'ok')  return <span className="ts ts-ok"><Icon name="check" size={13}/> Accepted</span>;
  if (st === 'tle') return <span className="ts ts-tle"><Icon name="clock" size={13}/> Time Limit</span>;
  if (st === 'wa')  return <span className="ts ts-wa"><Icon name="close" size={13}/> Wrong Answer</span>;
  if (st === 're')  return <span className="ts ts-re"><Icon name="close" size={13}/> Runtime Error</span>;
  return <span className="ts ts-pend"><Icon name="minus" size={13}/> Pending</span>;
}

export function Evaluation({ groups, total }: { groups: TestGroup[]; total: number }) {
  return (
    <>
      <div className="pb-eval-note"><Icon name="target" size={13}/> Group score is awarded only if all tests in that group pass. <span className="dim">Total possible score: 100</span></div>
      <div className="pb-eval-body">
        {groups.map((g, gi) => (
          <div key={gi} className="pb-group">
            <div className="pb-group-h">
              <span>{g.name} <span className="dim">({g.points} points)</span></span>
              <span className={'pb-group-pts' + (g.awarded > 0 ? '' : ' zero')}>{g.awarded}</span>
            </div>
            <div className="pb-testtable">
              <div className="pb-testrow pb-testhead"><span>Test</span><span>Status</span><span>Time</span><span>Memory</span></div>
              {g.tests.map(t => (
                <div key={t.n} className="pb-testrow">
                  <span className="dim">Test {t.n}</span>
                  <span><TestStatus st={t.status}/></span>
                  <span className="mono dim">{t.time}</span>
                  <span className="mono dim">{t.memory}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="pb-total"><Icon name="trophy" size={20}/> Total Score: <b>{total}</b> <span className="dim">/ 100</span></div>
    </>
  );
}
