try {
  throw new Error("foobar");
} finally {
  console.log('cleanup');
}
