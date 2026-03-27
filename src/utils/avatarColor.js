const PALETTE = [
  '#fde8ed', // pink-bg
  '#d6f0e0', // mint-bg
  '#ede8f8', // lavender-bg
  '#fdeee3', // cream-bg
  '#f0ede8', // gray-bg
];

const TEXT_COLORS = {
  '#fde8ed': '#c05070',
  '#d6f0e0': '#2e7d52',
  '#ede8f8': '#6b58c0',
  '#fdeee3': '#b55e1f',
  '#f0ede8': '#6b6860',
};

export function getAvatarColor(address) {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function getAvatarTextColor(bgColor) {
  return TEXT_COLORS[bgColor] || '#3d3d3a';
}

export function getInitials(address, email) {
  if (email) {
    const name = email.split('@')[0];
    return name.slice(0, 2).toUpperCase();
  }
  return address.slice(2, 4).toUpperCase();
}
