import { useState } from "react";
import { useNavigate } from "react-router";
import { Badge, Button, Callout, Card, Icon, PageHeader, Segmented, Spinner } from "../components/ui";
import { ApiError, api } from "../lib/api";
import { useAppState } from "../lib/app-state";
import type { ExtractionMode } from "../../shared/schemas";

export function Settings() {
  const { config, configError, mode, setMode, effectiveMode, toast, bumpData } = useAppState();
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const navigate = useNavigate();

  async function reset() {
    setResetting(true);
    try {
      const r = await api.resetDemo();
      bumpData();
      toast(`Demo reset. ${r.records} synthetic records loaded.`);
      setConfirming(false);
      navigate("/");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Reset failed.", "error");
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <PageHeader title="Settings and demo" subtitle="AI mode, demo data and what this prototype does and doesn't do." />

      <div className="grid max-w-3xl gap-4">
        <Card title="Claude extraction">
          <div className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-label">Mode</p>
                <p className="text-[13px] text-label-2">
                  {effectiveMode === "live"
                    ? `Notes are sent to Claude (${config?.model}) through this computer's server.`
                    : "Notes are not sent anywhere. Offline demo results are clearly labeled."}
                </p>
              </div>
              <Segmented<ExtractionMode>
                label="Extraction mode"
                value={effectiveMode}
                onChange={setMode}
                options={[
                  { value: "live", label: "Live Claude", disabled: !config?.liveAvailable },
                  { value: "offline", label: "Offline demo" },
                ]}
              />
            </div>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-label-2">API credential:</span>
              {configError ? (
                <Badge tone="red">Server not reachable</Badge>
              ) : config?.liveAvailable ? (
                <Badge tone="green" icon="checkCircle">Configured</Badge>
              ) : (
                <Badge tone="orange" icon="warning">Not configured</Badge>
              )}
            </div>
            {config && !config.liveAvailable && (
              <Callout tone="blue" title="To turn on live Claude">
                A Claude Enterprise login does not give this app API access. Someone with access to an Anthropic API
                account (or El Sol's approved model endpoint) needs to create an API key. Then copy{" "}
                <code className="font-mono text-[12px]">.env.example</code> to <code className="font-mono text-[12px]">.env</code>,
                paste the key after <code className="font-mono text-[12px]">ANTHROPIC_API_KEY=</code>, and restart the app. The
                key stays on the server and is never sent to the browser.
              </Callout>
            )}
            {mode === "live" && effectiveMode === "offline" && config?.liveAvailable === false && (
              <p className="text-[12px] text-label-3">Live mode is selected but unavailable, so Offline demo is used.</p>
            )}
          </div>
        </Card>

        <Card title="Demo data" description="Use before each panel run so the demo starts the same way every time.">
          <div className="flex flex-col gap-3 p-4">
            <p className="text-[13px] text-label-2">
              Reset deletes every record in this local demo database, including notes you created, and loads 4
              synthetic example records (3 approved, 1 draft).
            </p>
            {confirming ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-red-soft px-3 py-2.5" role="alertdialog" aria-label="Confirm reset">
                <Icon name="warning" className="text-red" />
                <span className="text-[13px] text-label">Delete all demo records and reload the examples?</span>
                <div className="ml-auto flex gap-2">
                  <Button onClick={() => setConfirming(false)} disabled={resetting}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={() => void reset()} disabled={resetting} autoFocus>
                    {resetting && <Spinner />}
                    Reset demo data
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <Button variant="destructive" icon="arrowCounter" onClick={() => setConfirming(true)}>
                  Reset demo data…
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card title="About this prototype">
          <ul className="flex flex-col gap-2 p-4 text-[13px] text-label">
            {[
              "Built for the Claude Corps Basecamp panel (El Sol NEC pod). Crawl-phase prototype.",
              "All records are synthetic and written by the pod. No El Sol client data.",
              "Runs entirely on this computer. Not connected to CommHealth Tracker, Azure or any cloud storage.",
              "Programs and template fields are illustrative and still need to be confirmed with El Sol staff.",
              "Claude never approves a record. A staff member reviews and approves every note.",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <Icon name="check" className="mt-0.5 text-accent" />
                {t}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
