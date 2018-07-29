export const getRisk = ({ prize, chanceToWin }) => (prize * chanceToWin) / (100 - chanceToWin);
