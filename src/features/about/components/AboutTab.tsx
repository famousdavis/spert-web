'use client'

import { APP_VERSION, APP_NAME, APP_DESCRIPTION } from '@/shared/constants'

// Helper component for trademark formatting (® never bold)
function TrademarkedName({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span className={className}>
      {name}<span className="font-normal">®</span>
    </span>
  )
}

export function AboutTab() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold">
          <TrademarkedName name={APP_NAME} />
        </h2>
        <p className="text-gray-500 italic">{APP_DESCRIPTION}</p>
      </div>

      <section className="space-y-2">
        <h3 className="font-medium">
          What is <TrademarkedName name={APP_NAME} />?
        </h3>
        <p className="text-sm text-gray-600">
          <TrademarkedName name="Statistical PERT" className="font-medium" /> (SPERT) makes
          statistical modeling accessible to project managers, Scrum Masters, students,
          businesspeople, and others who need to model uncertain outcomes using a lightweight,
          highly accessible approach. PERT stands for Program Evaluation and Review Technique,
          a classic project management method.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium">How it works</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>Create a project with your sprint cadence</li>
          <li>Record your sprint history with &quot;done&quot; values</li>
          <li>Enter your remaining backlog size</li>
          <li>Run a Monte Carlo simulation to get probabilistic finish dates</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium">About the simulation</h3>
        <p className="text-sm text-gray-600">
          The forecast uses a normal distribution based on your velocity mean and standard
          deviation. Each trial simulates completing the remaining backlog by drawing random
          velocities for each sprint until the work is done. The percentile results show the
          likelihood of finishing by each date.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium">Version</h3>
        <p className="text-sm text-gray-600">v{APP_VERSION}</p>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium">Trademark</h3>
        <p className="text-sm text-gray-600">
          SPERT and Statistical PERT are registered trademarks with the USPTO.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium">License</h3>
        <p className="text-sm text-gray-600">
          This software is licensed under the GNU General Public License v3.0 (GPL-3.0).
          You are free to use, modify, and distribute this software under the terms of the
          GPL-3.0 license.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium">Data Privacy</h3>
        <p className="text-sm text-gray-600">
          All data is stored locally in your browser using localStorage. No data is sent to
          any server. Your project and sprint data never leaves your device.
        </p>
      </section>
    </div>
  )
}
