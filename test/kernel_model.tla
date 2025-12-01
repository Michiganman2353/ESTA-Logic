------------------------------ MODULE kernel_model ------------------------------
\* ESTA Logic Microkernel TLA+ Model
\* 
\* This specification models the core kernel behavior for formal verification.
\* It covers process lifecycle, message passing, and scheduling invariants.
\* 
\* Reference: docs/abi/kernel_contract.md
\* Version: 1.0.0
\*
\* Verification targets:
\*   - No deadlock
\*   - Message delivery (eventual)
\*   - Starvation freedom
\*   - Memory safety
\*   - No priority inversion

EXTENDS Naturals, Sequences, FiniteSets, TLC

--------------------------------------------------------------------------------
\* CONSTANTS
--------------------------------------------------------------------------------

CONSTANTS
    MaxProcesses,       \* Maximum number of concurrent processes
    MaxMessages,        \* Maximum mailbox capacity
    MaxPriority,        \* Maximum priority level (5 = System)
    NumCores            \* Number of CPU cores

ASSUME MaxProcesses > 0
ASSUME MaxMessages > 0
ASSUME MaxPriority >= 5
ASSUME NumCores > 0

--------------------------------------------------------------------------------
\* STATE VARIABLES
--------------------------------------------------------------------------------

VARIABLES
    processes,          \* Set of process descriptors
    messages,           \* Sequence of in-flight messages
    mailboxes,          \* Function: pid -> sequence of messages
    scheduler,          \* Scheduler state
    running,            \* Set of currently running PIDs (at most NumCores)
    nextPid,            \* Next PID to assign
    clock               \* Logical clock for ordering

vars == <<processes, messages, mailboxes, scheduler, running, nextPid, clock>>

--------------------------------------------------------------------------------
\* TYPE DEFINITIONS
--------------------------------------------------------------------------------

\* Process states matching abi.gleam
ProcessStates == {"Created", "Ready", "Running", "Waiting", "Blocked", "Completed"}

\* Priority levels (0 = Idle, 5 = System)
Priorities == 0..MaxPriority

\* PID type (0 is reserved for kernel)
Pids == 1..MaxProcesses

\* Process descriptor
ProcessType == [
    pid: Pids,
    state: ProcessStates,
    priority: Priorities,
    waitTime: Nat,
    mailboxCapacity: Nat,
    parent: Pids \cup {0}  \* 0 = no parent (root process)
]

\* Message type
MessageType == [
    source: Pids,
    target: Pids,
    sequence: Nat,
    priority: 0..7,
    delivered: BOOLEAN
]

\* Scheduler state
SchedulerType == [
    readyQueue: Seq(Pids),
    contextSwitches: Nat
]

--------------------------------------------------------------------------------
\* TYPE INVARIANT
--------------------------------------------------------------------------------

TypeInvariant ==
    /\ processes \subseteq [pid: Pids, state: ProcessStates, priority: Priorities, 
                           waitTime: Nat, mailboxCapacity: Nat, parent: Pids \cup {0}]
    /\ DOMAIN mailboxes \subseteq Pids
    /\ \A pid \in DOMAIN mailboxes: mailboxes[pid] \in Seq(MessageType)
    /\ running \subseteq Pids
    /\ Cardinality(running) <= NumCores
    /\ nextPid \in 1..(MaxProcesses + 1)
    /\ clock \in Nat

--------------------------------------------------------------------------------
\* HELPER OPERATORS
--------------------------------------------------------------------------------

\* Get process by PID
GetProcess(pid) ==
    CHOOSE p \in processes: p.pid = pid

\* Check if process exists
ProcessExists(pid) ==
    \E p \in processes: p.pid = pid

\* Get effective priority with aging (matches abi.gleam logic)
EffectivePriority(p) ==
    LET boost == p.waitTime \div 1000
        effectivePri == p.priority + (IF boost > 2 THEN 2 ELSE boost)
    IN IF effectivePri > 4 THEN 4 ELSE effectivePri  \* Cap at Realtime (4)

\* Get highest priority ready process
HighestPriorityReady ==
    IF \E p \in processes: p.state = "Ready"
    THEN CHOOSE p \in processes: 
            /\ p.state = "Ready"
            /\ \A q \in processes: 
                (q.state = "Ready") => EffectivePriority(p) >= EffectivePriority(q)
    ELSE CHOOSE p \in processes: FALSE  \* undefined if no ready process

\* Mailbox is not full
MailboxHasSpace(pid) ==
    IF pid \in DOMAIN mailboxes /\ ProcessExists(pid)
    THEN Len(mailboxes[pid]) < GetProcess(pid).mailboxCapacity
    ELSE FALSE

\* Count messages to a target
MessagesTo(targetPid) ==
    Cardinality({m \in messages: m.target = targetPid /\ ~m.delivered})

--------------------------------------------------------------------------------
\* INITIAL STATE
--------------------------------------------------------------------------------

Init ==
    /\ processes = {}
    /\ messages = {}
    /\ mailboxes = [p \in {} |-> <<>>]
    /\ scheduler = [readyQueue |-> <<>>, contextSwitches |-> 0]
    /\ running = {}
    /\ nextPid = 1
    /\ clock = 0

--------------------------------------------------------------------------------
\* PROCESS LIFECYCLE ACTIONS
--------------------------------------------------------------------------------

\* Spawn a new process
Spawn(priority, parent) ==
    /\ nextPid <= MaxProcesses
    /\ LET newPid == nextPid
           newProcess == [
               pid |-> newPid,
               state |-> "Created",
               priority |-> priority,
               waitTime |-> 0,
               mailboxCapacity |-> IF priority >= 4 THEN 4096 ELSE 1024,
               parent |-> parent
           ]
       IN /\ processes' = processes \cup {newProcess}
          /\ mailboxes' = mailboxes @@ (newPid :> <<>>)
          /\ nextPid' = nextPid + 1
          /\ clock' = clock + 1
          /\ UNCHANGED <<messages, scheduler, running>>

\* Move Created -> Ready
MakeReady(pid) ==
    /\ ProcessExists(pid)
    /\ GetProcess(pid).state = "Created"
    /\ LET oldP == GetProcess(pid)
           newP == [oldP EXCEPT !.state = "Ready"]
       IN /\ processes' = (processes \ {oldP}) \cup {newP}
          /\ scheduler' = [scheduler EXCEPT 
                           !.readyQueue = Append(@, pid)]
          /\ clock' = clock + 1
          /\ UNCHANGED <<messages, mailboxes, running, nextPid>>

\* Schedule a ready process to run
Schedule(pid) ==
    /\ ProcessExists(pid)
    /\ GetProcess(pid).state = "Ready"
    /\ Cardinality(running) < NumCores
    /\ LET oldP == GetProcess(pid)
           newP == [oldP EXCEPT !.state = "Running", !.waitTime = 0]
       IN /\ processes' = (processes \ {oldP}) \cup {newP}
          /\ running' = running \cup {pid}
          /\ scheduler' = [scheduler EXCEPT 
                           !.readyQueue = SelectSeq(@, LAMBDA x: x # pid),
                           !.contextSwitches = @ + 1]
          /\ clock' = clock + 1
          /\ UNCHANGED <<messages, mailboxes, nextPid>>

\* Preempt running process for higher priority
Preempt(currentPid, newPid) ==
    /\ ProcessExists(currentPid)
    /\ ProcessExists(newPid)
    /\ GetProcess(currentPid).state = "Running"
    /\ GetProcess(newPid).state = "Ready"
    /\ EffectivePriority(GetProcess(newPid)) > EffectivePriority(GetProcess(currentPid))
    /\ GetProcess(currentPid).priority < 5  \* Cannot preempt System priority
    /\ LET oldCurrent == GetProcess(currentPid)
           oldNew == GetProcess(newPid)
           newCurrent == [oldCurrent EXCEPT !.state = "Ready"]
           newNew == [oldNew EXCEPT !.state = "Running", !.waitTime = 0]
       IN /\ processes' = (processes \ {oldCurrent, oldNew}) \cup {newCurrent, newNew}
          /\ running' = (running \ {currentPid}) \cup {newPid}
          /\ scheduler' = [scheduler EXCEPT 
                           !.readyQueue = Append(SelectSeq(@, LAMBDA x: x # newPid), currentPid),
                           !.contextSwitches = @ + 1]
          /\ clock' = clock + 1
          /\ UNCHANGED <<messages, mailboxes, nextPid>>

\* Yield: Running -> Ready
Yield(pid) ==
    /\ ProcessExists(pid)
    /\ GetProcess(pid).state = "Running"
    /\ LET oldP == GetProcess(pid)
           newP == [oldP EXCEPT !.state = "Ready"]
       IN /\ processes' = (processes \ {oldP}) \cup {newP}
          /\ running' = running \ {pid}
          /\ scheduler' = [scheduler EXCEPT 
                           !.readyQueue = Append(@, pid)]
          /\ clock' = clock + 1
          /\ UNCHANGED <<messages, mailboxes, nextPid>>

\* Wait for message: Running -> Waiting
WaitForMessage(pid) ==
    /\ ProcessExists(pid)
    /\ GetProcess(pid).state = "Running"
    /\ pid \in DOMAIN mailboxes
    /\ Len(mailboxes[pid]) = 0  \* Mailbox is empty
    /\ LET oldP == GetProcess(pid)
           newP == [oldP EXCEPT !.state = "Waiting"]
       IN /\ processes' = (processes \ {oldP}) \cup {newP}
          /\ running' = running \ {pid}
          /\ clock' = clock + 1
          /\ UNCHANGED <<messages, mailboxes, scheduler, nextPid>>

\* Complete: Running -> Completed
Complete(pid) ==
    /\ ProcessExists(pid)
    /\ GetProcess(pid).state = "Running"
    /\ LET oldP == GetProcess(pid)
           newP == [oldP EXCEPT !.state = "Completed"]
       IN /\ processes' = (processes \ {oldP}) \cup {newP}
          /\ running' = running \ {pid}
          /\ clock' = clock + 1
          /\ UNCHANGED <<messages, mailboxes, scheduler, nextPid>>

--------------------------------------------------------------------------------
\* MESSAGE PASSING ACTIONS
--------------------------------------------------------------------------------

\* Send a message
SendMessage(sourcePid, targetPid, priority) ==
    /\ ProcessExists(sourcePid)
    /\ ProcessExists(targetPid)
    /\ GetProcess(sourcePid).state = "Running"
    /\ GetProcess(targetPid).state \in {"Ready", "Running", "Waiting"}
    /\ MailboxHasSpace(targetPid)
    /\ LET newMsg == [
           source |-> sourcePid,
           target |-> targetPid,
           sequence |-> clock,
           priority |-> priority,
           delivered |-> FALSE
       ]
       IN /\ messages' = messages \cup {newMsg}
          /\ clock' = clock + 1
          /\ UNCHANGED <<processes, mailboxes, scheduler, running, nextPid>>

\* Deliver a message to mailbox
DeliverMessage(msg) ==
    /\ msg \in messages
    /\ ~msg.delivered
    /\ ProcessExists(msg.target)
    /\ GetProcess(msg.target).state \in {"Ready", "Running", "Waiting"}
    /\ MailboxHasSpace(msg.target)
    /\ LET updatedMsg == [msg EXCEPT !.delivered = TRUE]
       IN /\ messages' = (messages \ {msg}) \cup {updatedMsg}
          /\ mailboxes' = [mailboxes EXCEPT ![msg.target] = 
                          Append(@, updatedMsg)]
          /\ clock' = clock + 1
          /\ UNCHANGED <<processes, scheduler, running, nextPid>>

\* Wake up waiting process when message arrives
WakeOnMessage(pid) ==
    /\ ProcessExists(pid)
    /\ GetProcess(pid).state = "Waiting"
    /\ pid \in DOMAIN mailboxes
    /\ Len(mailboxes[pid]) > 0  \* Message in mailbox
    /\ LET oldP == GetProcess(pid)
           newP == [oldP EXCEPT !.state = "Ready"]
       IN /\ processes' = (processes \ {oldP}) \cup {newP}
          /\ scheduler' = [scheduler EXCEPT 
                           !.readyQueue = Append(@, pid)]
          /\ clock' = clock + 1
          /\ UNCHANGED <<messages, mailboxes, running, nextPid>>

\* Receive a message (consume from mailbox)
ReceiveMessage(pid) ==
    /\ ProcessExists(pid)
    /\ GetProcess(pid).state = "Running"
    /\ pid \in DOMAIN mailboxes
    /\ Len(mailboxes[pid]) > 0
    /\ mailboxes' = [mailboxes EXCEPT ![pid] = Tail(@)]
    /\ clock' = clock + 1
    /\ UNCHANGED <<processes, messages, scheduler, running, nextPid>>

--------------------------------------------------------------------------------
\* AGING / STARVATION PREVENTION
--------------------------------------------------------------------------------

\* Increment wait time for waiting/ready processes
AgeTick ==
    /\ processes' = {
        [p EXCEPT !.waitTime = IF p.state \in {"Ready", "Waiting"} 
                               THEN @ + 100 ELSE @]
        : p \in processes}
    /\ clock' = clock + 1
    /\ UNCHANGED <<messages, mailboxes, scheduler, running, nextPid>>

--------------------------------------------------------------------------------
\* NEXT STATE RELATION
--------------------------------------------------------------------------------

Next ==
    \/ \E pri \in Priorities, parent \in Pids \cup {0}: Spawn(pri, parent)
    \/ \E pid \in Pids: MakeReady(pid)
    \/ \E pid \in Pids: Schedule(pid)
    \/ \E cur \in Pids, new \in Pids: Preempt(cur, new)
    \/ \E pid \in Pids: Yield(pid)
    \/ \E pid \in Pids: WaitForMessage(pid)
    \/ \E pid \in Pids: Complete(pid)
    \/ \E src \in Pids, tgt \in Pids, pri \in 0..7: SendMessage(src, tgt, pri)
    \/ \E msg \in messages: DeliverMessage(msg)
    \/ \E pid \in Pids: WakeOnMessage(pid)
    \/ \E pid \in Pids: ReceiveMessage(pid)
    \/ AgeTick

Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

--------------------------------------------------------------------------------
\* SAFETY INVARIANTS
--------------------------------------------------------------------------------

\* All processes are in valid states
ValidStates ==
    \A p \in processes: p.state \in ProcessStates

\* At most NumCores processes running
SingleCoreRunning ==
    Cardinality(running) <= NumCores

\* Running set matches process states
RunningConsistent ==
    /\ \A pid \in running: ProcessExists(pid) /\ GetProcess(pid).state = "Running"
    /\ \A p \in processes: p.state = "Running" => p.pid \in running

\* All mailboxes are within capacity
MailboxBounded ==
    \A pid \in DOMAIN mailboxes:
        ProcessExists(pid) => Len(mailboxes[pid]) <= GetProcess(pid).mailboxCapacity

\* All messages have valid source and target
MessageValidity ==
    \A m \in messages:
        /\ m.source \in Pids
        /\ m.target \in Pids

\* No priority inversion (higher priority process not stuck behind lower)
NoPriorityInversion ==
    \A p \in processes, q \in processes:
        (p.state = "Ready" /\ q.state = "Running" /\ 
         EffectivePriority(p) > EffectivePriority(q) /\
         q.priority < 5)  \* System priority cannot be preempted
        => Cardinality(running) >= NumCores

\* Combined safety invariant
SafetyInvariant ==
    /\ TypeInvariant
    /\ ValidStates
    /\ SingleCoreRunning
    /\ RunningConsistent
    /\ MailboxBounded
    /\ MessageValidity
    /\ NoPriorityInversion

--------------------------------------------------------------------------------
\* LIVENESS PROPERTIES
--------------------------------------------------------------------------------

\* Progress: If any process ready and cores available, eventually some process runs
Progress ==
    [](\E p \in processes: p.state = "Ready" /\ Cardinality(running) < NumCores)
      => <>(\E p \in processes: p.state = "Running")

\* Message Delivery: All sent messages eventually delivered or process terminated
MessageDelivery ==
    \A m \in messages: <>(m.delivered \/ ~ProcessExists(m.target))

\* No Starvation: Ready processes eventually get to run
NoStarvation ==
    \A p \in processes: 
        [](p.state = "Ready" => <>(p.state \in {"Running", "Completed"}))

\* Waiting processes eventually wake (if messages sent to them)
WaitingWake ==
    \A p \in processes:
        [](p.state = "Waiting" /\ p.pid \in DOMAIN mailboxes /\ Len(mailboxes[p.pid]) > 0)
        => <>(p.state = "Ready")

--------------------------------------------------------------------------------
\* VERIFICATION PROPERTIES
--------------------------------------------------------------------------------

\* Deadlock freedom (always some action is possible or all processes completed)
DeadlockFree ==
    ENABLED(Next) \/ \A p \in processes: p.state = "Completed"

\* Fairness: min(actual/expected CPU) >= 0.8 approximation
\* Note: Full fairness metric requires temporal logic extensions

================================================================================
