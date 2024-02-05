function sum(a, b) {
  return a + b;
}

test('국밥', () => {
  //expect가 toBe 메서드 가짐. sum은 안가짐.
  expect(sum(1, 3)).toBe(4);
});

//sum.test만 인식함, __test__ 폴더 자체를 인식 못하고 있음.
