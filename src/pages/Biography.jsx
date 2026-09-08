import { useState } from 'react';
import { Play, Send, Heart, Mail } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { QueryState } from '../components/ui';
import { safeExternalUrl } from '@/lib/media';
import { useBiography } from '../hooks/useBiography';
import { usePageMeta } from '../hooks/usePageMeta';
import { t } from '@/i18n';

const socialLinkClass = 'flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm text-white transition-opacity hover:opacity-90';

function Biography() {
    const { data: bio, isLoading, isError, error, refetch } = useBiography();
    const [photoFailed, setPhotoFailed] = useState(false);
    usePageMeta({ title: t('biography.title'), description: bio?.shortBio, image: bio?.photoUrl });

    return (
        <PageShell sidebar={false} contentClassName="max-w-reading mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-2xl font-bold text-center mb-8">{t('biography.title')}</h1>

            <QueryState
                isLoading={isLoading}
                isError={isError}
                error={error}
                onRetry={refetch}
                isEmpty={!bio}
                emptyTitle={t('biography.empty')}
            >
                {bio && (
                    <div className="bg-surface p-6 sm:p-10 rounded-xl shadow-sm border border-border-light print:p-0 print:shadow-none print:border-0">
                        {/* An external URL an admin typed. onError drops the image rather than
                            leaving a broken-image glyph in a 150px circle at the top of the page. */}
                        {bio.photoUrl && !photoFailed && (
                            <img
                                src={bio.photoUrl}
                                alt={bio.fullName}
                                onError={() => setPhotoFailed(true)}
                                className="w-[150px] h-[150px] rounded-full object-cover mx-auto mb-6"
                            />
                        )}

                        <h1 className="text-center text-3xl font-bold mb-2">{bio.fullName || t('biography.defaultName')}</h1>

                        {bio.occupation && (
                            <p className="text-center text-text-secondary mb-6">{bio.occupation}</p>
                        )}

                        {bio.shortBio && (
                            <p className="text-center text-lg leading-loose mb-8">{bio.shortBio}</p>
                        )}

                        {bio.detailedBio && (
                            <div className="whitespace-pre-wrap leading-loose text-[1.05rem] text-text-secondary">
                                {bio.detailedBio}
                            </div>
                        )}

                        {bio.education && (
                            <div className="mt-6 p-4 bg-bg rounded-lg">
                                <strong>{t('biography.education')}</strong> {bio.education}
                            </div>
                        )}

                        <div className="flex gap-3 justify-center mt-8 flex-wrap print:hidden">
                            {safeExternalUrl(bio.youtubeUrl) && (
                                <a href={safeExternalUrl(bio.youtubeUrl)} target="_blank" rel="noopener noreferrer"
                                   className={socialLinkClass} style={{ background: '#FF0000' }}>
                                    <Play size={16} /> {t('biography.youtube')}
                                </a>
                            )}
                            {safeExternalUrl(bio.telegramUrl) && (
                                <a href={safeExternalUrl(bio.telegramUrl)} target="_blank" rel="noopener noreferrer"
                                   className={socialLinkClass} style={{ background: '#0088cc' }}>
                                    <Send size={16} /> {t('biography.telegram')}
                                </a>
                            )}
                            {safeExternalUrl(bio.patreonUrl) && (
                                <a href={safeExternalUrl(bio.patreonUrl)} target="_blank" rel="noopener noreferrer"
                                   className={`${socialLinkClass} text-[#8B6914]`} style={{ background: '#FEF9E7' }}>
                                    <Heart size={16} /> Patreon
                                </a>
                            )}
                            {bio.email && (
                                <a href={`mailto:${bio.email}`}
                                   className={`${socialLinkClass} !text-primary border border-primary`} style={{ background: 'transparent' }}>
                                    <Mail size={16} /> {t('biography.contact')}
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </QueryState>
        </PageShell>
    );
}

export default Biography;
