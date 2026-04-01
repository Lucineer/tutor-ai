import type { StudentProfile, SessionLog, Mistake, Flashcard, ProgressSnapshot, Goal } from './tutor/tracker';

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

const TOPICS = ['arrays', 'linked-lists', 'trees', 'graphs', 'dynamic-programming', 'sorting', 'recursion', 'hash-tables'];

export const SEED_DATA = {
  profile: {
    id: 'alex_001',
    name: 'Alex',
    subjects: ['Algorithms', 'Data Structures', 'System Design'],
    learningStyle: 'hands-on' as const,
    goals: ['Master all core data structures', 'Solve 200 LeetCode problems', 'Ace technical interviews'],
    preferredDifficulty: 'intermediate' as const,
    dailyStudyMinutes: 60,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(0),
  },

  sessions: generateSessions(),

  mistakes: generateMistakes(),

  flashcards: generateFlashcards(),

  progress: generateProgress(),

  goals: generateGoals(),

  patterns: [
    {
      id: 'pat_recursion_base',
      name: 'Recursion base case errors',
      description: 'Forgetting to define or incorrectly defining the base case in recursive functions',
      topic: 'recursion',
      mistakeIds: ['mistake_recursion_1', 'mistake_recursion_3', 'mistake_recursion_5'],
      firstSeen: daysAgo(85),
      lastSeen: daysAgo(3),
      occurrences: 5,
    },
    {
      id: 'pat_bfs_dfs',
      name: 'BFS/DFS traversal confusion',
      description: 'Mixing up breadth-first and depth-first traversal order and their data structures',
      topic: 'graphs',
      mistakeIds: ['mistake_graphs_1', 'mistake_graphs_3', 'mistake_graphs_5'],
      firstSeen: daysAgo(80),
      lastSeen: daysAgo(5),
      occurrences: 5,
    },
    {
      id: 'pat_dp_overlapping',
      name: 'DP overlapping subproblems',
      description: 'Failing to identify overlapping subproblems and using naive recursion instead of memoization',
      topic: 'dynamic-programming',
      mistakeIds: ['mistake_dp_1', 'mistake_dp_3'],
      firstSeen: daysAgo(70),
      lastSeen: daysAgo(8),
      occurrences: 3,
    },
  ],
};

function generateSessions(): SessionLog[] {
  const sessions: SessionLog[] = [];
  for (let i = 0; i < 30; i++) {
    const day = 89 - i * 3;
    const topic = TOPICS[i % TOPICS.length];
    const problemsAttempted = 4 + Math.floor(Math.random() * 6);
    const earlyMistakes = i < 10 ? 0.4 : i < 20 ? 0.6 : 0.75;
    const problemsSolved = Math.max(1, Math.round(problemsAttempted * (earlyMistakes + Math.random() * 0.2)));

    sessions.push({
      id: `session_${String(i + 1).padStart(3, '0')}`,
      date: daysAgo(day),
      subject: 'Algorithms',
      topic,
      durationMinutes: 25 + Math.floor(Math.random() * 35),
      problemsAttempted,
      problemsSolved,
      score: Math.round((problemsSolved / problemsAttempted) * 100),
      notes: generateSessionNote(topic, i),
    });
  }
  return sessions;
}

function generateSessionNote(topic: string, index: number): string {
  const notes: Record<string, string[]> = {
    arrays: ['Worked on two-pointer technique', 'Sliding window practice — need more work', 'Prefix sum problems went well'],
    'linked-lists': ['Reversed a linked list — finally clicked!', 'Cycle detection with Floyd\'s algorithm', 'Doubly linked list insertion practice'],
    trees: ['Inorder traversal — struggled with iterative version', 'BST operations going smoothly', 'Level-order traversal using a queue'],
    graphs: ['BFS vs DFS — keep mixing them up', 'Dijkstra\'s algorithm practice', 'Topological sort finally makes sense'],
    'dynamic-programming': ['Knapsack problem — tough but getting it', 'Fibonacci with memoization — easy now', 'Longest common subsequence — need more practice'],
    sorting: ['QuickSort partition scheme practice', 'Merge sort — stable sort concept clear', 'Counting sort for constrained inputs'],
    recursion: ['Base cases still catching me out', 'Tail recursion concept clicked today', 'Recursive backtracking for permutations'],
    'hash-tables': ['Collision resolution strategies', 'Load factor and rehashing', 'Two sum problem — hash map is elegant'],
  };
  const topicNotes = notes[topic] || ['Good practice session'];
  return topicNotes[index % topicNotes.length];
}

function generateMistakes(): Mistake[] {
  return [
    // Recursion mistakes (5) — pattern: base case errors
    {
      id: 'mistake_recursion_1', date: daysAgo(85), subject: 'Algorithms', topic: 'recursion',
      question: 'Write a recursive function to compute factorial of n',
      wrongAnswer: 'function factorial(n) { return n * factorial(n-1); }',
      correctAnswer: 'function factorial(n) { if (n <= 1) return 1; return n * factorial(n-1); }',
      misconception: 'Missing base case — forgot the termination condition',
      correctExplanation: 'Every recursive function needs a base case that stops recursion. Without it, you get infinite recursion and a stack overflow.',
      patternId: 'pat_recursion_base',
    },
    {
      id: 'mistake_recursion_2', date: daysAgo(79), subject: 'Algorithms', topic: 'recursion',
      question: 'What is the base case for binary search?',
      wrongAnswer: 'When the array has 2 elements',
      correctAnswer: 'When start > end (search space is empty)',
      misconception: 'Wrong base case — stopped too early instead of exhausting the search space',
      correctExplanation: 'Binary search terminates when the search space is empty (start > end), not when it reaches a certain size.',
    },
    {
      id: 'mistake_recursion_3', date: daysAgo(62), subject: 'Algorithms', topic: 'recursion',
      question: 'Write a recursive function to reverse a string',
      wrongAnswer: 'function reverse(str) { return reverse(str.slice(1)) + str[0]; }',
      correctAnswer: 'function reverse(str) { if (str.length <= 1) return str; return reverse(str.slice(1)) + str[0]; }',
      misconception: 'Missing base case — forgot to handle empty or single-character strings',
      correctExplanation: 'Without a base case for length <= 1, calling reverse("") will try to access str[0] on an empty string forever.',
      patternId: 'pat_recursion_base',
    },
    {
      id: 'mistake_recursion_4', date: daysAgo(40), subject: 'Algorithms', topic: 'recursion',
      question: 'How many calls does fib(5) make without memoization?',
      wrongAnswer: '5 calls',
      correctAnswer: '15 calls (many are redundant)',
      misconception: 'Underestimated the exponential blowup of naive recursion',
      correctExplanation: 'Naive fibonacci makes O(2^n) calls. fib(5) actually makes 15 calls because fib(3), fib(2), fib(1) are each computed multiple times.',
    },
    {
      id: 'mistake_recursion_5', date: daysAgo(3), subject: 'Algorithms', topic: 'recursion',
      question: 'Write a recursive flatten function for nested arrays',
      wrongAnswer: 'function flatten(arr) { return arr.map(x => Array.isArray(x) ? flatten(x) : x); }',
      correctAnswer: 'function flatten(arr) { return arr.reduce((acc, x) => acc.concat(Array.isArray(x) ? flatten(x) : x), []); }',
      misconception: 'Map doesn\'t flatten — need to reduce/concat to actually merge sub-arrays',
      correctExplanation: 'map() preserves array structure. You need reduce() with concat() to actually merge nested results into a flat array.',
      patternId: 'pat_recursion_base',
    },

    // Graph mistakes (6) — pattern: BFS/DFS confusion
    {
      id: 'mistake_graphs_1', date: daysAgo(80), subject: 'Algorithms', topic: 'graphs',
      question: 'Which data structure does BFS use?',
      wrongAnswer: 'Stack',
      correctAnswer: 'Queue',
      misconception: 'Confused BFS (queue) with DFS (stack)',
      correctExplanation: 'BFS uses a queue (FIFO) to explore neighbors level by level. DFS uses a stack (LIFO) to go deep first.',
      patternId: 'pat_bfs_dfs',
    },
    {
      id: 'mistake_graphs_2', date: daysAgo(74), subject: 'Algorithms', topic: 'graphs',
      question: 'What is the time complexity of BFS?',
      wrongAnswer: 'O(log V)',
      correctAnswer: 'O(V + E)',
      misconception: 'Guessed logarithmic instead of linear in vertices + edges',
      correctExplanation: 'BFS visits every vertex once and explores every edge once, giving O(V + E) time complexity.',
    },
    {
      id: 'mistake_graphs_3', date: daysAgo(55), subject: 'Algorithms', topic: 'graphs',
      question: 'What order does DFS visit nodes in this graph?',
      wrongAnswer: 'Level by level, all neighbors first',
      correctAnswer: 'Goes deep along one path before backtracking',
      misconception: 'Described BFS behavior when asked about DFS',
      correctExplanation: 'DFS goes as deep as possible along each branch before backtracking. "Level by level" describes BFS.',
      patternId: 'pat_bfs_dfs',
    },
    {
      id: 'mistake_graphs_4', date: daysAgo(38), subject: 'Algorithms', topic: 'graphs',
      question: 'When should you prefer Dijkstra over BFS?',
      wrongAnswer: 'When the graph is directed',
      correctAnswer: 'When edges have different weights',
      misconception: 'Thought graph direction matters, not edge weights',
      correctExplanation: 'BFS finds shortest paths in unweighted graphs. Dijkstra handles weighted graphs. Direction is irrelevant to this choice.',
    },
    {
      id: 'mistake_graphs_5', date: daysAgo(18), subject: 'Algorithms', topic: 'graphs',
      question: 'In BFS, when do you mark a node as visited?',
      wrongAnswer: 'When you process (dequeue) it',
      correctAnswer: 'When you discover (enqueue) it',
      misconception: 'Marking visited too late causes duplicate nodes in the queue',
      correctExplanation: 'Mark nodes visited when enqueuing, not when dequeuing. Otherwise the same node gets enqueued multiple times by different neighbors.',
      patternId: 'pat_bfs_dfs',
    },
    {
      id: 'mistake_graphs_6', date: daysAgo(5), subject: 'Algorithms', topic: 'graphs',
      question: 'Topological sort requires which graph property?',
      wrongAnswer: 'The graph must be undirected',
      correctAnswer: 'The graph must be a DAG (directed acyclic graph)',
      misconception: 'Forgot that topological sort requires directed AND acyclic',
      correctExplanation: 'Topological sort only works on DAGs. Cycles create circular dependencies that can\'t be linearly ordered.',
    },

    // Dynamic Programming mistakes (6)
    {
      id: 'mistake_dp_1', date: daysAgo(70), subject: 'Algorithms', topic: 'dynamic-programming',
      question: 'Is memoization top-down or bottom-up?',
      wrongAnswer: 'Bottom-up',
      correctAnswer: 'Top-down',
      misconception: 'Confused memoization (top-down) with tabulation (bottom-up)',
      correctExplanation: 'Memoization is top-down: you start from the original problem and cache sub-results. Tabulation is bottom-up: you build up from base cases.',
      patternId: 'pat_dp_overlapping',
    },
    {
      id: 'mistake_dp_2', date: daysAgo(65), subject: 'Algorithms', topic: 'dynamic-programming',
      question: 'What makes a problem suitable for dynamic programming?',
      wrongAnswer: 'It involves arrays',
      correctAnswer: 'It has overlapping subproblems and optimal substructure',
      misconception: 'Focused on data structure rather than the two key properties',
      correctExplanation: 'DP applies when subproblems overlap (same subproblems computed repeatedly) AND the problem has optimal substructure (optimal solution contains optimal subsolutions).',
    },
    {
      id: 'mistake_dp_3', date: daysAgo(45), subject: 'Algorithms', topic: 'dynamic-programming',
      question: 'Why is naive recursive fib O(2^n)?',
      wrongAnswer: 'Because it does 2 operations per call',
      correctAnswer: 'Because it recomputes the same subproblems exponentially many times',
      misconception: 'Misunderstood why naive recursion is slow — it\'s redundant computation, not operations per call',
      correctExplanation: 'Each fib(n) call spawns 2 sub-calls, and they overlap massively. fib(3) is computed as part of fib(5), fib(6), fib(7), etc.',
      patternId: 'pat_dp_overlapping',
    },
    {
      id: 'mistake_dp_4', date: daysAgo(30), subject: 'Algorithms', topic: 'dynamic-programming',
      question: 'In the 0/1 knapsack, what does the DP table represent?',
      wrongAnswer: 'dp[i] = maximum value for item i',
      correctAnswer: 'dp[i][w] = maximum value using first i items with capacity w',
      misconception: 'Used 1D state when 2D state (items × capacity) is needed',
      correctExplanation: 'Knapsack needs a 2D table because the answer depends on both which items you\'ve considered AND the remaining capacity.',
    },
    {
      id: 'mistake_dp_5', date: daysAgo(20), subject: 'Algorithms', topic: 'dynamic-programming',
      question: 'Can you solve LCS with a greedy approach?',
      wrongAnswer: 'Yes, just take matching characters left to right',
      correctAnswer: 'No, greedy doesn\'t guarantee optimality for LCS',
      misconception: 'Assumed greedy would work for an optimization problem that needs DP',
      correctExplanation: 'LCS requires trying both possibilities (match or skip) at each position. Greedy choices can lock you out of the true optimal solution.',
    },
    {
      id: 'mistake_dp_6', date: daysAgo(8), subject: 'Algorithms', topic: 'dynamic-programming',
      question: 'What\'s the space optimization for the 0/1 knapsack DP?',
      wrongAnswer: 'Use a hash map instead of an array',
      correctAnswer: 'Use a 1D array and iterate capacity in reverse',
      misconception: 'Thought about data structure optimization instead of the classic reverse-iteration trick',
      correctExplanation: 'By iterating w from W down to 0, you can use a single array because each dp[w] only depends on dp[w-weight[i]] from the previous row.',
    },

    // Trees mistakes (5)
    {
      id: 'mistake_trees_1', date: daysAgo(82), subject: 'Algorithms', topic: 'trees',
      question: 'What is the height of a binary tree with n nodes?',
      wrongAnswer: 'log(n) always',
      correctAnswer: 'log(n) if balanced, up to n in the worst case',
      misconception: 'Assumed all binary trees are balanced',
      correctExplanation: 'Only balanced BSTs have height O(log n). A skewed tree (every node has one child) has height O(n).',
    },
    {
      id: 'mistake_trees_2', date: daysAgo(60), subject: 'Algorithms', topic: 'trees',
      question: 'In-order traversal of a BST produces elements in what order?',
      wrongAnswer: 'Random order',
      correctAnswer: 'Sorted (ascending) order',
      misconception: 'Didn\'t know that BST in-order traversal gives sorted output',
      correctExplanation: 'BST property (left < root < right) means in-order (left, root, right) visits nodes in ascending order.',
    },
    {
      id: 'mistake_trees_3', date: daysAgo(48), subject: 'Algorithms', topic: 'trees',
      question: 'How many nodes in a complete binary tree of height h?',
      wrongAnswer: 'h^2',
      correctAnswer: '2^h - 1 (if full), between 2^(h-1) and 2^h - 1 (if complete)',
      misconception: 'Used polynomial formula instead of exponential',
      correctExplanation: 'Binary trees grow exponentially: each level doubles. A full binary tree of height h has 2^h - 1 nodes.',
    },
    {
      id: 'mistake_trees_4', date: daysAgo(25), subject: 'Algorithms', topic: 'trees',
      question: 'What advantage does an AVL tree have over a regular BST?',
      wrongAnswer: 'Faster insertion in all cases',
      correctAnswer: 'Guaranteed O(log n) operations by keeping the tree balanced',
      misconception: 'AVL trees actually have SLOWER insertion due to rotations — the advantage is guaranteed height',
      correctExplanation: 'AVL trees sacrifice insertion speed (extra rotations) for guaranteed O(log n) search. A regular BST can degrade to O(n) if unbalanced.',
    },
    {
      id: 'mistake_trees_5', date: daysAgo(10), subject: 'Algorithms', topic: 'trees',
      question: 'What is the minimum number of rotations to fix an AVL imbalance?',
      wrongAnswer: '3 rotations',
      correctAnswer: '1 rotation (single) or 2 rotations (double for LR/RL cases)',
      misconception: 'Overestimated the rotations needed',
      correctExplanation: 'LL and RR imbalances need 1 rotation. LR and RL imbalances need 2 rotations (double rotation). Never more.',
    },

    // Sorting mistakes (5)
    {
      id: 'mistake_sorting_1', date: daysAgo(78), subject: 'Algorithms', topic: 'sorting',
      question: 'What is QuickSort\'s worst-case time complexity?',
      wrongAnswer: 'O(n log n)',
      correctAnswer: 'O(n^2) when the pivot is always the min or max',
      misconception: 'Only remembered average case, forgot worst case',
      correctExplanation: 'QuickSort is O(n log n) average but O(n^2) worst case (e.g., already sorted array with first-element pivot). Randomized pivot avoids this.',
    },
    {
      id: 'mistake_sorting_2', date: daysAgo(56), subject: 'Algorithms', topic: 'sorting',
      question: 'Which sort is stable?',
      wrongAnswer: 'QuickSort',
      correctAnswer: 'MergeSort',
      misconception: 'Thought QuickSort preserves relative order of equal elements',
      correctExplanation: 'QuickSort is NOT stable — partitioning can swap equal elements. MergeSort preserves order because it merges left-to-right.',
    },
    {
      id: 'mistake_sorting_3', date: daysAgo(42), subject: 'Algorithms', topic: 'sorting',
      question: 'When is MergeSort preferred over QuickSort?',
      wrongAnswer: 'When memory is limited',
      correctAnswer: 'When stability is needed and worst-case O(n log n) matters',
      misconception: 'MergeSort uses MORE memory (O(n) extra), not less',
      correctExplanation: 'MergeSort needs O(n) extra space but guarantees O(n log n) worst case and is stable. Use it when those properties matter more than space.',
    },
    {
      id: 'mistake_sorting_4', date: daysAgo(22), subject: 'Algorithms', topic: 'sorting',
      question: 'What is counting sort\'s time complexity?',
      wrongAnswer: 'O(n log n)',
      correctAnswer: 'O(n + k) where k is the range of input values',
      misconception: 'Assumed all sorts are O(n log n)',
      correctExplanation: 'Counting sort is non-comparative. It counts occurrences, so it\'s O(n + k). Great when k is small, terrible when k >> n.',
    },
    {
      id: 'mistake_sorting_5', date: daysAgo(12), subject: 'Algorithms', topic: 'sorting',
      question: 'What does it mean for a sort to be "in-place"?',
      wrongAnswer: 'It uses O(n) extra space',
      correctAnswer: 'It uses O(1) extra space (only a constant amount)',
      misconception: 'Confused O(n) with O(1) for auxiliary space',
      correctExplanation: 'In-place means constant extra space. QuickSort is nearly in-place (O(log n) for recursion). MergeSort is NOT in-place (O(n) auxiliary array).',
    },

    // Hash table mistakes (5)
    {
      id: 'mistake_hash_1', date: daysAgo(76), subject: 'Algorithms', topic: 'hash-tables',
      question: 'What happens when a hash table\'s load factor gets too high?',
      wrongAnswer: 'Nothing, it just uses more memory',
      correctAnswer: 'Performance degrades; the table should be resized and rehashed',
      misconception: 'Didn\'t know about rehashing when load factor exceeds threshold',
      correctExplanation: 'High load factor means more collisions. The table resizes (usually doubles) and rehashes all entries to maintain O(1) average operations.',
    },
    {
      id: 'mistake_hash_2', date: daysAgo(58), subject: 'Algorithms', topic: 'hash-tables',
      question: 'What is separate chaining for collision resolution?',
      wrongAnswer: 'Try the next slot linearly',
      correctAnswer: 'Store a linked list at each index for colliding entries',
      misconception: 'Described linear probing instead of separate chaining',
      correctExplanation: 'Separate chaining: each bucket holds a linked list of entries that hash to that index. Linear probing is open addressing — a different strategy.',
    },
    {
      id: 'mistake_hash_3', date: daysAgo(35), subject: 'Algorithms', topic: 'hash-tables',
      question: 'Average time complexity for hash table lookup?',
      wrongAnswer: 'O(n)',
      correctAnswer: 'O(1) average, O(n) worst case',
      misconception: 'Only knew worst case, didn\'t realize average is constant',
      correctExplanation: 'With a good hash function and reasonable load factor, lookups are O(1) on average. Worst case (all keys collide) is O(n).',
    },
    {
      id: 'mistake_hash_4', date: daysAgo(15), subject: 'Algorithms', topic: 'hash-tables',
      question: 'Why can\'t you use a hash map to solve the Two Sum problem in one pass... actually you can. How?',
      wrongAnswer: 'Sort the array first, then use two pointers',
      correctAnswer: 'For each element, check if (target - element) is already in the hash map',
      misconception: 'Defaulted to sorting approach instead of the elegant hash map one-pass solution',
      correctExplanation: 'As you iterate, for each number x, check if (target - x) exists in your map. If yes, you found the pair. If no, add x to the map and continue.',
    },
    {
      id: 'mistake_hash_5', date: daysAgo(6), subject: 'Algorithms', topic: 'hash-tables',
      question: 'What makes a good hash function?',
      wrongAnswer: 'It should be complex and slow to deter attacks',
      correctAnswer: 'It should distribute keys uniformly and be fast to compute',
      misconception: 'Confused cryptographic hashing with hash table hashing',
      correctExplanation: 'For hash tables, you want fast computation and uniform distribution. Cryptographic hashes (slow, one-way) are overkill and hurt performance.',
    },

    // Linked list mistakes (4)
    {
      id: 'mistake_ll_1', date: daysAgo(72), subject: 'Algorithms', topic: 'linked-lists',
      question: 'How do you detect a cycle in a linked list?',
      wrongAnswer: 'Check if any node\'s value repeats',
      correctAnswer: 'Use Floyd\'s cycle detection (slow + fast pointer)',
      misconception: 'Values can repeat without a cycle — need to compare references, not values',
      correctExplanation: 'Floyd\'s algorithm uses two pointers moving at different speeds. If there\'s a cycle, they\'ll eventually meet. Checking values is wrong because values can repeat.',
    },
    {
      id: 'mistake_ll_2', date: daysAgo(50), subject: 'Algorithms', topic: 'linked-lists',
      question: 'What is the advantage of a linked list over an array?',
      wrongAnswer: 'Random access in O(1)',
      correctAnswer: 'O(1) insertion/deletion at a known position',
      misconception: 'Linked lists do NOT have O(1) random access — that\'s arrays',
      correctExplanation: 'Arrays have O(1) random access. Linked lists have O(n) access but O(1) insert/delete at a known position (no shifting needed).',
    },
    {
      id: 'mistake_ll_3', date: daysAgo(28), subject: 'Algorithms', topic: 'linked-lists',
      question: 'How do you reverse a linked list iteratively?',
      wrongAnswer: 'Swap the values of the first and last nodes',
      correctAnswer: 'Use three pointers (prev, curr, next) to reverse links one at a time',
      misconception: 'Tried to swap values instead of reversing the pointer directions',
      correctExplanation: 'Reversing a linked list means changing each node\'s next pointer to point backwards. You need prev/curr/next pointers to not lose track.',
    },
    {
      id: 'mistake_ll_4', date: daysAgo(9), subject: 'Algorithms', topic: 'linked-lists',
      question: 'What is a dummy head node used for?',
      wrongAnswer: 'To store the length of the list',
      correctAnswer: 'To simplify edge cases when modifying the head of the list',
      misconception: 'Didn\'t understand the purpose of a sentinel/dummy node',
      correctExplanation: 'A dummy head eliminates special cases. Without it, inserting at or deleting the head requires separate logic. With it, all operations are uniform.',
    },

    // Arrays mistakes (4)
    {
      id: 'mistake_arrays_1', date: daysAgo(83), subject: 'Algorithms', topic: 'arrays',
      question: 'What is the time complexity of inserting at the beginning of an array?',
      wrongAnswer: 'O(1)',
      correctAnswer: 'O(n) — all elements must shift right',
      misconception: 'Forgot that array insertions at the beginning require shifting all elements',
      correctExplanation: 'Arrays are contiguous in memory. Inserting at position 0 means every other element must shift right by one — O(n) time.',
    },
    {
      id: 'mistake_arrays_2', date: daysAgo(52), subject: 'Algorithms', topic: 'arrays',
      question: 'How does the two-pointer technique work for finding a pair with a given sum in a sorted array?',
      wrongAnswer: 'Use nested loops to check all pairs',
      correctAnswer: 'Start one pointer at each end, move inward based on comparison with target',
      misconception: 'Defaulted to brute force instead of leveraging sorted order',
      correctExplanation: 'With sorted data, start pointers at both ends. If sum < target, move left pointer right. If sum > target, move right pointer left. O(n) vs O(n^2).',
    },
    {
      id: 'mistake_arrays_3', date: daysAgo(33), subject: 'Algorithms', topic: 'arrays',
      question: 'What is the sliding window technique?',
      wrongAnswer: 'Sorting the array in a window',
      correctAnswer: 'Maintaining a subset (window) that expands/contracts to solve subarray problems efficiently',
      misconception: 'Didn\'t understand what sliding window actually does',
      correctExplanation: 'Sliding window maintains a range [left, right] that slides across the array. Instead of recomputing from scratch, you add/remove elements at the boundaries.',
    },
    {
      id: 'mistake_arrays_4', date: daysAgo(7), subject: 'Algorithms', topic: 'arrays',
      question: 'Prefix sum: what is the sum of elements from index i to j?',
      wrongAnswer: 'arr[j] - arr[i]',
      correctAnswer: 'prefix[j+1] - prefix[i]',
      misconception: 'Off-by-one error in prefix sum formula',
      correctExplanation: 'Build prefix array where prefix[0]=0, prefix[k]=sum of first k elements. Sum from i to j = prefix[j+1] - prefix[i]. The +1 is crucial.',
    },
  ];
}

function generateFlashcards(): Flashcard[] {
  const cards: Flashcard[] = [];
  const templates: [string, string, string][] = [
    // Arrays
    ['What is the time complexity of accessing an array element by index?', 'O(1) — arrays provide constant-time random access because elements are stored in contiguous memory locations', 'arrays'],
    ['How does the two-pointer technique work?', 'Place pointers at strategic positions (often both ends) and move them based on comparisons, reducing O(n^2) to O(n)', 'arrays'],
    ['What is a prefix sum and when is it useful?', 'An array where each element stores the cumulative sum up to that point. Useful for range sum queries in O(1)', 'arrays'],
    ['Explain the sliding window technique', 'Maintain a variable-size window over the array, expanding/contracting based on conditions. Avoids recomputing from scratch.', 'arrays'],
    ['What is the difference between an array and a dynamic array?', 'Arrays have fixed size. Dynamic arrays (like JS Array, ArrayList) auto-resize by allocating a larger array and copying elements.', 'arrays'],

    // Linked Lists
    ['How does Floyd\'s cycle detection work?', 'Use two pointers: slow (1 step) and fast (2 steps). If they meet, there\'s a cycle. If fast reaches null, no cycle.', 'linked-lists'],
    ['How do you reverse a linked list?', 'Iteratively: use prev/curr/next pointers. Save next, point curr to prev, advance prev and curr. Return prev as new head.', 'linked-lists'],
    ['Why use a dummy head node?', 'Simplifies edge cases at the head. All insertions/deletions use the same logic without special-casing the first node.', 'linked-lists'],
    ['What is the advantage of a doubly linked list?', 'O(1) deletion given a node reference (no need to find previous). Supports backward traversal.', 'linked-lists'],
    ['Array vs Linked List for insertion at the beginning?', 'Array: O(n) (shift all). Linked List: O(1) (just update head pointer). Linked lists win for frequent head insertions.', 'linked-lists'],

    // Trees
    ['What are the three types of depth-first traversal?', 'Pre-order (root, left, right), In-order (left, root, right), Post-order (left, right, root)', 'trees'],
    ['What is the BST property?', 'For every node: all left descendants are smaller, all right descendants are larger', 'trees'],
    ['What is the height of a balanced BST with n nodes?', 'O(log n). This is why BST operations like search, insert, delete are O(log n) when balanced.', 'trees'],
    ['How does an AVL tree stay balanced?', 'After insert/delete, check balance factor (height diff of subtrees). If |balance| > 1, perform rotations to rebalance.', 'trees'],
    ['Level-order traversal uses what data structure?', 'A queue. Process node, enqueue children, dequeue next. This gives BFS order.', 'trees'],
    ['What is the difference between a binary tree and a BST?', 'Binary tree: each node has at most 2 children. BST: binary tree WITH the ordering property (left < root < right).', 'trees'],

    // Graphs
    ['BFS uses which data structure? DFS?', 'BFS uses a Queue (FIFO). DFS uses a Stack (LIFO) or recursion.', 'graphs'],
    ['When to use Dijkstra vs BFS?', 'BFS for unweighted graphs (all edges equal). Dijkstra for weighted graphs (edges have different costs).', 'graphs'],
    ['What is topological sorting?', 'Linear ordering of vertices where every directed edge goes from earlier to later. Only works on DAGs.', 'graphs'],
    ['How to detect cycles in a directed graph?', 'Use DFS with a recursion stack. If you visit a node already in the current path, there\'s a cycle.', 'graphs'],
    ['What is a strongly connected component?', 'A maximal set of vertices where every vertex is reachable from every other vertex in the set.', 'graphs'],
    ['BFS time complexity?', 'O(V + E) — visits every vertex once and explores every edge once.', 'graphs'],

    // Dynamic Programming
    ['What two properties must a problem have for DP?', '1. Overlapping subproblems (same subproblems solved repeatedly). 2. Optimal substructure (optimal solution contains optimal subsolutions).', 'dynamic-programming'],
    ['Memoization vs Tabulation?', 'Memoization: top-down, recursive with caching. Tabulation: bottom-up, iterative, fills a table from base cases up.', 'dynamic-programming'],
    ['How to optimize 2D DP space to 1D?', 'If dp[i] only depends on dp[i-1], use a single array. For knapsack: iterate capacity in reverse to avoid overwriting needed values.', 'dynamic-programming'],
    ['What is the 0/1 Knapsack recurrence?', 'dp[i][w] = max(dp[i-1][w], dp[i-1][w-weight[i]] + value[i]) — either skip item i or include it.', 'dynamic-programming'],
    ['Explain the LCS (Longest Common Subsequence) DP approach', 'dp[i][j] = length of LCS of first i chars of s1 and first j chars of s2. If s1[i]==s2[j], dp[i][j]=dp[i-1][j-1]+1. Else max(dp[i-1][j], dp[i][j-1]).', 'dynamic-programming'],
    ['How many unique ways to climb n stairs (1 or 2 steps)?', 'dp[i] = dp[i-1] + dp[i-2]. Same as Fibonacci. dp[0]=1, dp[1]=1.', 'dynamic-programming'],

    // Sorting
    ['QuickSort: average and worst case?', 'Average: O(n log n). Worst: O(n^2) when pivot is always min/max (e.g., sorted array with first-element pivot).', 'sorting'],
    ['Which sorts are stable?', 'MergeSort, InsertionSort, BubbleSort, CountingSort. QuickSort and HeapSort are NOT stable.', 'sorting'],
    ['MergeSort space complexity?', 'O(n) auxiliary space for the temporary array. This is its main disadvantage vs QuickSort.', 'sorting'],
    ['When is Counting Sort efficient?', 'When the range of values (k) is small relative to n. Time O(n + k). Terrible when k >> n.', 'sorting'],
    ['What does "in-place" sorting mean?', 'Uses only O(1) extra space. QuickSort is nearly in-place (O(log n) stack). MergeSort is NOT in-place (O(n)).', 'sorting'],
    ['HeapSort time and space complexity?', 'Time: O(n log n) guaranteed. Space: O(1) in-place. Stable: No. Good when you need guaranteed O(n log n) with minimal space.', 'sorting'],

    // Recursion
    ['What are the two essential parts of a recursive function?', '1. Base case(s) — termination condition(s). 2. Recursive case — the function calls itself with a simpler input.', 'recursion'],
    ['What is tail recursion?', 'The recursive call is the LAST operation. Compilers can optimize it to O(1) space (tail call optimization).', 'recursion'],
    ['How to convert recursion to iteration?', 'Use an explicit stack to replace the call stack. Push initial state, loop while stack not empty, push new states.', 'recursion'],
    ['What causes stack overflow in recursion?', 'Too deep recursion (no base case, or base case never reached). Each call adds a frame to the call stack.', 'recursion'],
    ['When to use recursion vs iteration?', 'Recursion when the problem is naturally recursive (trees, divide & conquer). Iteration for simple loops or when stack depth is a concern.', 'recursion'],

    // Hash Tables
    ['Average and worst case for hash table lookup?', 'Average: O(1). Worst: O(n) when all keys hash to the same bucket.', 'hash-tables'],
    ['What is the load factor of a hash table?', 'n/k where n = number of entries, k = number of buckets. When it exceeds a threshold (usually 0.75), the table resizes.', 'hash-tables'],
    ['Separate chaining vs open addressing?', 'Chaining: each bucket holds a list of entries. Open addressing: on collision, probe for the next empty slot (linear, quadratic, or double hashing).', 'hash-tables'],
    ['How to solve Two Sum in one pass?', 'For each element x, check if (target - x) exists in a hash map. If yes, return indices. If no, store x with its index.', 'hash-tables'],
    ['What makes a good hash function for hash tables?', 'Fast to compute and distributes keys uniformly across buckets. NOT cryptographic — different goal.', 'hash-tables'],
  ];

  templates.forEach(([front, back, topic], i) => {
    const daysSinceReview = Math.floor(Math.random() * 20);
    const interval = 1 + Math.floor(Math.random() * 14);
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval - daysSinceReview);
    const lastReviewed = new Date();
    lastReviewed.setDate(lastReviewed.getDate() - daysSinceReview);

    cards.push({
      id: `card_${String(i + 1).padStart(3, '0')}`,
      front,
      back,
      subject: 'Algorithms',
      topic,
      lastReviewed: lastReviewed.toISOString().split('T')[0],
      nextReview: nextReview.toISOString().split('T')[0],
      easeFactor: 2.5 - Math.random() * 0.5,
      interval,
      repetitions: Math.floor(Math.random() * 5),
    });
  });

  return cards;
}

function generateProgress(): ProgressSnapshot[] {
  const snapshots: ProgressSnapshot[] = [];
  const baseMasteries: Record<string, number> = {
    arrays: 40,
    'linked-lists': 30,
    trees: 25,
    graphs: 20,
    'dynamic-programming': 15,
    sorting: 45,
    recursion: 30,
    'hash-tables': 35,
  };

  for (let i = 0; i < 12; i++) {
    const day = 84 - i * 7;
    const masteries: Record<string, number> = {};
    for (const [topic, base] of Object.entries(baseMasteries)) {
      const growth = (12 - i) * (2 + Math.random() * 4);
      const noise = (Math.random() - 0.5) * 8;
      masteries[topic] = Math.min(95, Math.max(5, Math.round(base + growth + noise)));
    }

    const totalHours = Math.round((i + 1) * 5 + Math.random() * 3);
    snapshots.push({
      id: `progress_${String(i + 1).padStart(3, '0')}`,
      date: daysAgo(day),
      subjectMasteries: masteries,
      streakCount: Math.min(i + 3, 14),
      totalStudyHours: totalHours,
      weeklyStudyHours: Math.round(3 + Math.random() * 5),
      problemsSolved: Math.round(20 + i * 12 + Math.random() * 10),
      accuracyRate: Math.min(0.95, 0.5 + i * 0.03 + Math.random() * 0.1),
    });
  }
  return snapshots;
}

function generateGoals(): Goal[] {
  return [
    {
      id: 'goal_001',
      title: 'Master Dynamic Programming',
      subject: 'Algorithms',
      description: 'Go from struggling with DP to confidently solving medium-hard DP problems',
      targetDate: daysAgo(-30),
      completed: false,
      createdAt: daysAgo(60),
      checkpoints: [
        { id: 'cp_001_1', title: 'Understand memoization vs tabulation', completed: true, completedAt: daysAgo(55) },
        { id: 'cp_001_2', title: 'Solve 10 classic DP problems', completed: true, completedAt: daysAgo(40) },
        { id: 'cp_001_3', title: 'Master knapsack variants', completed: true, completedAt: daysAgo(25) },
        { id: 'cp_001_4', title: 'Solve 5 DP problems without hints', completed: false },
        { id: 'cp_001_5', title: 'Complete a DP contest', completed: false },
      ],
    },
    {
      id: 'goal_002',
      title: 'Conquer Graph Algorithms',
      subject: 'Algorithms',
      description: 'Stop confusing BFS/DFS and handle any graph problem confidently',
      targetDate: daysAgo(-14),
      completed: false,
      createdAt: daysAgo(45),
      checkpoints: [
        { id: 'cp_002_1', title: 'Internalize BFS vs DFS differences', completed: true, completedAt: daysAgo(35) },
        { id: 'cp_002_2', title: 'Implement Dijkstra from scratch', completed: true, completedAt: daysAgo(20) },
        { id: 'cp_002_3', title: 'Solve 10 graph problems on LeetCode', completed: false },
        { id: 'cp_002_4', title: 'Understand topological sort deeply', completed: false },
      ],
    },
    {
      id: 'goal_003',
      title: '200 LeetCode Problems',
      subject: 'Algorithms',
      description: 'Build consistent problem-solving muscle by reaching 200 solved problems',
      targetDate: daysAgo(-60),
      completed: false,
      createdAt: daysAgo(90),
      checkpoints: [
        { id: 'cp_003_1', title: 'Reach 50 problems', completed: true, completedAt: daysAgo(70) },
        { id: 'cp_003_2', title: 'Reach 100 problems', completed: true, completedAt: daysAgo(35) },
        { id: 'cp_003_3', title: 'Reach 150 problems', completed: false },
        { id: 'cp_003_4', title: 'Reach 200 problems', completed: false },
      ],
    },
    {
      id: 'goal_004',
      title: 'Nail Technical Interviews',
      subject: 'Algorithms',
      description: 'Be interview-ready with strong fundamentals and communication',
      targetDate: daysAgo(-15),
      completed: false,
      createdAt: daysAgo(60),
      checkpoints: [
        { id: 'cp_004_1', title: 'Mock interview 1 — passed', completed: true, completedAt: daysAgo(30) },
        { id: 'cp_004_2', title: 'Mock interview 2 — improve communication', completed: false },
        { id: 'cp_004_3', title: 'System design basics', completed: false },
        { id: 'cp_004_4', title: 'Complete 5 real interview rounds', completed: false },
      ],
    },
  ];
}
