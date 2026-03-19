import { renderMermaidSVG } from "./index.mjs";
import { writeFileSync } from "fs";

const svg = await renderMermaidSVG(`flowchart TD
    A{"Concrete type known\\nat compile time?"}
    A -->|No| BDYN["Box&lt;dyn Trait&gt;\\ntype only known at runtime"]
    A -->|Yes| B{"Single clear owner?"}

    B -->|No - shared ownership| C{"Multiple threads?"}
    C -->|No| D{"Need to mutate\\nthe shared value?"}
    D -->|No| RC["Rc&lt;T&gt;\\nmultiple readers, one thread"]
    D -->|Yes| RCREF["Rc&lt;RefCell&lt;T&gt;&gt;\\nmultiple owners that mutate"]
    RC -->|back-reference\\nor cache entry| WEAK["Weak&lt;T&gt;\\nobserve without keeping alive"]

    C -->|Yes| E{"Need to mutate\\nthe shared value?"}
    E -->|No| ARC["Arc&lt;T&gt;\\nmultiple readers, many threads"]
    E -->|Yes| ARCMUT["Arc&lt;Mutex&lt;T&gt;&gt;\\nmultiple owners that mutate\\nacross threads"]

    B -->|Yes| F{"Needs heap or\\nrecursive struct?"}
    F -->|Yes| BOX["Box&lt;T&gt;\\none owner, lives on heap"]
    F -->|No| G{"Need to mutate through\\na shared reference?"}
    G -->|No| PLAIN["Plain T\\nstack value, one owner"]
    G -->|Yes - interior mutability| H{"T is a primitive\\ne.g. i32, bool?"}
    H -->|Yes| CELL["Cell&lt;T&gt;\\ncheaper, no borrow overhead"]
    H -->|No - Vec, String, struct| REFCELL["RefCell&lt;T&gt;\\nborrow-checked at runtime"]
`);

const outputPath = "rust-ownership-flowchart.svg";
writeFileSync(outputPath, svg);
console.log(`Written to ${outputPath} (${svg.length} chars)`);
