export function isPlatformAdmin(user) {
    return user?.role === 'PLATFORM_ADMIN';
}

export function isChannelOwner(user, channel) {
    return !!(user && channel && channel.ownerUserId === user.id);
}

export function canManageChannel(user, channel) {
    return isChannelOwner(user, channel) || isPlatformAdmin(user);
}
