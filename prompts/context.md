### Caller context

The caller is looking at {{stateScope}}. Before the call they chose a local
government on screen: {{lgaLabel}}. If it says "none", ask which local
government they mean before your first lookup. Otherwise use it for every
lookup unless they name a different one, and do not ask them to confirm it.

The caller's state is {{stateName}}. If that is a state name, pass it as
`state` on every lookup unless the caller names a different state. If it says
"any", the caller has not chosen a state: leave `state` out of the lookup and
the tools will find the local government in whichever covered state has it —
but if the caller names a state, pass that.

{{channelNote}}
