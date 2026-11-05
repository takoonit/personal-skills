------------------------ MODULE WorkItemStart ------------------------
EXTENDS Integers, FiniteSets, TLC

CONSTANTS GuardApproval, GuardReady, GuardWorkspace, GuardWriter
Units == {1, 2}
FactNames == {"schema", "ready", "workspace"}
VARIABLES revision, approved, facts, owner, stage, active,
          sawApproval, sawReady, sawWorkspace

vars == <<revision, approved, facts, owner, stage, active,
          sawApproval, sawReady, sawWorkspace>>
CurrentApproval == facts["schema"] /\ approved = revision

Init ==
    /\ revision = 0
    /\ approved = -1
    /\ facts \in [FactNames -> BOOLEAN]
    /\ owner = 0
    /\ stage = [u \in Units |-> "pending"]
    /\ active = {}
    /\ sawApproval = [u \in Units |-> FALSE]
    /\ sawReady = [u \in Units |-> FALSE]
    /\ sawWorkspace = [u \in Units |-> FALSE]

Acquire(u) ==
    /\ owner = 0 /\ stage[u] = "pending"
    /\ owner' = u
    /\ stage' = [stage EXCEPT ![u] = "approval"]
    /\ UNCHANGED <<revision, approved, facts, active,
                   sawApproval, sawReady, sawWorkspace>>

CheckApproval(u) ==
    /\ owner = u /\ stage[u] = "approval"
    /\ sawApproval' = [sawApproval EXCEPT ![u] = CurrentApproval]
    /\ IF ~GuardApproval \/ CurrentApproval
       THEN /\ stage' = [stage EXCEPT ![u] = "ready"]
            /\ UNCHANGED owner
       ELSE /\ stage' = [stage EXCEPT ![u] = "rejected"]
            /\ owner' = 0
    /\ UNCHANGED <<revision, approved, facts, active, sawReady, sawWorkspace>>

CheckReadiness(u) ==
    /\ owner = u /\ stage[u] = "ready"
    /\ sawReady' = [sawReady EXCEPT ![u] = facts["ready"]]
    /\ IF (~GuardReady \/ facts["ready"]) /\ (~GuardWriter \/ active = {})
       THEN /\ stage' = [stage EXCEPT ![u] = "workspace"]
            /\ UNCHANGED owner
       ELSE /\ stage' = [stage EXCEPT ![u] = "rejected"]
            /\ owner' = 0
    /\ UNCHANGED <<revision, approved, facts, active, sawApproval, sawWorkspace>>

CheckWorkspace(u) ==
    /\ owner = u /\ stage[u] = "workspace"
    /\ sawWorkspace' = [sawWorkspace EXCEPT ![u] = facts["workspace"]]
    /\ IF ~GuardWorkspace \/ facts["workspace"]
       THEN /\ stage' = [stage EXCEPT ![u] = "persist"]
            /\ UNCHANGED owner
       ELSE /\ stage' = [stage EXCEPT ![u] = "rejected"]
            /\ owner' = 0
    /\ UNCHANGED <<revision, approved, facts, active, sawApproval, sawReady>>

Persist(u) ==
    /\ owner = u /\ stage[u] = "persist"
    /\ active' = active \cup {u}
    /\ stage' = [stage EXCEPT ![u] = "active"]
    /\ owner' = 0
    /\ UNCHANGED <<revision, approved, facts, sawApproval, sawReady, sawWorkspace>>

Finish(u) ==
    /\ owner = 0 /\ u \in active
    /\ active' = active \ {u}
    /\ stage' = [stage EXCEPT ![u] = "done"]
    /\ UNCHANGED <<revision, approved, facts, owner, sawApproval, sawReady, sawWorkspace>>

Approve ==
    /\ owner = 0
    /\ approved' = revision
    /\ UNCHANGED <<revision, facts, owner, stage, active, sawApproval, sawReady, sawWorkspace>>

Revise ==
    /\ owner = 0 /\ revision = 0
    /\ revision' = 1
    /\ UNCHANGED <<approved, facts, owner, stage, active, sawApproval, sawReady, sawWorkspace>>

ChangeFacts ==
    /\ owner = 0
    /\ facts' \in [FactNames -> BOOLEAN]
    /\ UNCHANGED <<revision, approved, owner, stage, active, sawApproval, sawReady, sawWorkspace>>

Next ==
    Approve \/ Revise \/ ChangeFacts \/
    (\E u \in Units :
        Acquire(u) \/ CheckApproval(u) \/ CheckReadiness(u) \/
        CheckWorkspace(u) \/ Persist(u) \/ Finish(u))

ApprovedAdmission == \A u \in active : sawApproval[u]
ReadyAdmission == \A u \in active : sawReady[u]
WorkspaceAdmission == \A u \in active : sawWorkspace[u]
SingleWriter == Cardinality(active) <= 1
Spec == Init /\ [][Next]_vars
=============================================================================
