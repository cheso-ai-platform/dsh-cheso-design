import { useEffect, useRef, useState } from 'react';
import type { QuestionPreview, QuestionReceipt } from '../tasks';

type QuestionActivity = { previews: QuestionPreview[] | null; receipts?: QuestionReceipt[] };

/** 按等待工具的调用 ID 轮询当前提问预览和已提交的答复记录。 */
export function useQuestionActivity(callId?: string) {
  const [activity, setActivity] = useState<QuestionActivity>({ previews: null });
  useEffect(() => {
    if (!callId) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ call_id: callId });
    let next: ReturnType<typeof setTimeout>;
    /** 更新调用的提问状态，并在组件仍订阅时安排下一次轮询。 */
    async function poll() {
      try {
        const response = await fetch(`/api/cheso/question-previews?${query}`, { signal: controller.signal });
        if (response.ok) {
          const state: QuestionActivity = await response.json();
          if (!controller.signal.aborted) setActivity(state);
        }
      } catch {
        // 遇到短暂的连接故障时，保留原生问答卡并继续轮询。
      } finally {
        if (!controller.signal.aborted) next = setTimeout(poll, 2000);
      }
    }
    void poll();
    return () => {
      controller.abort();
      clearTimeout(next);
    };
  }, [callId]);
  return activity;
}

const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;
const PREVIEW_HEADER = '<!doctype html><meta charset="utf-8">'
  + '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; base-uri \'none\'; form-action \'none\'">'
  + '<style>html,body{margin:0;overflow:hidden}</style>';

/** 在沙盒 iframe 中显示幻灯片缩略图，并按容器宽度缩放。 */
function SlidePreview({ label, html }: QuestionPreview) {
  const viewport = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <figure style={{ margin: 0, minWidth: 0, border: '1px solid var(--dsh-border, rgba(127,127,127,.25))',
      borderRadius: 8, overflow: 'hidden' }}>
      <div ref={viewport} style={{ position: 'relative', aspectRatio: '16 / 9', overflow: 'hidden', background: '#fff' }}>
        {width > 0 ? (
          <iframe title={label} srcDoc={PREVIEW_HEADER + html} sandbox="" tabIndex={-1} referrerPolicy="no-referrer"
            style={{ position: 'absolute', top: 0, left: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT,
              border: 0, pointerEvents: 'none', transformOrigin: 'top left', transform: `scale(${width / SLIDE_WIDTH})` }} />
        ) : null}
      </div>
      <figcaption style={{ padding: '4px 8px', overflowWrap: 'anywhere' }}>{label}</figcaption>
    </figure>
  );
}

/** 在问答卡中按网格排列选项提供的幻灯片预览。 */
export function QuestionPreviews({ previews }: { previews: QuestionPreview[] }) {
  if (!previews.length) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 168px), 1fr))',
      gap: 8, marginBottom: 8 }}>
      {previews.map((preview, index) => <SlidePreview key={index} {...preview} />)}
    </div>
  );
}
