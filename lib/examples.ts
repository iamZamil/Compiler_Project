export const examples = [
  {
    name: "Factorial",
    code: `// Factorial function
int factorial(int n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

int main() {
  int result = factorial(5);
  print(result);
  return 0;
}`,
  },
  {
    name: "Fibonacci",
    code: `// Fibonacci sequence
int fibonacci(int n) {
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
  int result = fibonacci(10);
  print(result);
  return 0;
}`,
  },
  {
    name: "Loop Example",
    code: `// Loop example
int main() {
  int sum = 0;
  
  // For loop
  for (int i = 1; i <= 10; i = i + 1) {
    sum = sum + i;
  }
  
  print(sum);
  return 0;
}`,
  },
  {
    name: "If-Else Example",
    code: `// If-else example
int max(int a, int b) {
  if (a > b) {
    return a;
  } else {
    return b;
  }
}

int main() {
  int result = max(10, 5);
  print(result);
  return 0;
}`,
  },
  {
    name: "While Loop",
    code: `// While loop example
int main() {
  int i = 1;
  int sum = 0;
  
  while (i <= 10) {
    sum = sum + i;
    i = i + 1;
  }
  
  print(sum);
  return 0;
}`,
  },
]
