export function isPlatformAdmin(user) {
    return user?.role === 'PLATFORM_ADMIN';
}

// Whether the account gets the "upload" shortcut. One wording, because on a phone that shortcut
// lives in the drawer and on a wider screen in the navbar, and the two must not disagree.
export function canUpload(user) {
    return ['CREATOR', 'CHANNEL_ADMIN', 'PLATFORM_ADMIN'].includes(user?.role);
}

export function isChannelOwner(user, channel) {
    return !!(user && channel && channel.ownerUserId === user.id);
}

export function canManageChannel(user, channel) {
    return isChannelOwner(user, channel) || isPlatformAdmin(user);
}

// Where "upload" leads: the first owned channel's dashboard, or channel creation for an account
// that has none yet. Shared by the navbar and the phone drawer for the same reason as `canUpload`.
export function uploadPathFor(myChannels) {
    return myChannels?.length > 0 ? `/channel/${myChannels[0].slug}/manage` : '/create-channel';
}
