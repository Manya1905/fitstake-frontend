const PALETTE = [
  '#e57373', '#f06292', '#ba68c8', '#7986cb', '#64b5f6',
  '#4dd0e1', '#4db6ac', '#81c784', '#aed581', '#ffb74d',
];

export function getAvatarColor(address) {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function getInitials(address, email) {
  if (email) {
    const name = email.split('@')[0];
    return name.slice(0, 2).toUpperCase();
  }
  return address.slice(2, 4).toUpperCase();
}
