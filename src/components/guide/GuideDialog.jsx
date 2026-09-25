import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal, KhatamEmblem, KhatamStar, IrisMark } from '../ui';
import { GUIDE_STEPS } from './guideSteps';
import { t } from '@/i18n';

/**
 * The guide as a few pages to step through, for someone who has just arrived: one idea per page,
 * the star emblem naming the place, and dots — small stars — saying how far there is to go.
 * "Skip" is always there; nothing here is required reading.
 */
function GuideDialog({ open, onClose }) {
    const [index, setIndex] = useState(0);
    const step = GUIDE_STEPS[index];
    const last = index === GUIDE_STEPS.length - 1;

    const close = () => {
        onClose();
        setIndex(0);
    };

    return (
        <Modal open={open} onClose={close} title={t('guide.title')} maxWidth="520px">
            <div className="flex flex-col items-center text-center min-h-[300px]">
                {step.icon ? (
                    <KhatamEmblem icon={step.icon} className="mb-5" />
                ) : (
                    <IrisMark size="100%" state="draw" className="w-24 h-24 mb-5" />
                )}
                <h2 className="font-serif text-[1.8rem] font-semibold leading-tight">{t(`guide.steps.${step.key}.title`)}</h2>
                <p className="font-reading text-text-secondary mt-3 leading-relaxed max-w-[42ch]">
                    {t(`guide.steps.${step.key}.text`)}
                </p>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4" aria-label={t('guide.progress', { step: index + 1, total: GUIDE_STEPS.length })}>
                {GUIDE_STEPS.map((s, i) => (
                    <KhatamStar
                        key={s.key}
                        filled={i === index}
                        strokeWidth={8}
                        className={`w-3 h-3 ${i === index ? 'text-gold' : 'text-border'}`}
                    />
                ))}
            </div>

            <div className="flex items-center justify-between gap-3 mt-6">
                <button type="button" onClick={close} className="text-sm font-semibold text-text-muted hover:text-text-primary">
                    {t('guide.skip')}
                </button>
                <div className="flex gap-2">
                    {index > 0 && (
                        <button
                            type="button"
                            onClick={() => setIndex(index - 1)}
                            className="px-4 py-2 border border-border rounded-md bg-bg font-semibold text-sm hover:border-primary"
                        >
                            {t('guide.back')}
                        </button>
                    )}
                    {last ? (
                        <button type="button" onClick={close} className="px-5 py-2 bg-primary text-white rounded-md font-semibold text-sm">
                            {t('guide.done')}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIndex(index + 1)}
                            className="px-5 py-2 bg-primary text-white rounded-md font-semibold text-sm"
                        >
                            {t('guide.next')}
                        </button>
                    )}
                </div>
            </div>
            <p className="text-center text-xs text-text-muted mt-5">
                <Link to="/guide" onClick={close}>{t('guide.fullPage')}</Link>
            </p>
        </Modal>
    );
}

export default GuideDialog;
