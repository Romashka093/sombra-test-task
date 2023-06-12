export const createDoubleUniqueArray = length => {
  const uniqueArray = Array.from({ length: length / 2 }, (_, index) => ({
    number: index + 1,
  }));

  return uniqueArray
    .flatMap(card => [card, { ...card }])
    .sort(() => Math.random() - 0.5);
};
