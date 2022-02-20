module.exports = {
    icon: function(iconName, useInline) {
        const spriteUrl = '/icons.svg'
        const iconId = `#icon-${iconName}`
        const href = useInline ? iconId : spriteUrl + iconId

        return `<svg class="icon icon--${iconName}" role="img" aria-hidden="true" width="24" height="24">
                    <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="${href}"></use>
                </svg>`
    }
}
