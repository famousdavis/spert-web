'use client'

import { APP_VERSION, APP_NAME, APP_DESCRIPTION } from '@/shared/constants'

// Helper component for trademark formatting (® never bold)
function TrademarkedName({ name, bold = false }: { name: string; bold?: boolean }) {
  return (
    <span>
      {bold ? <strong>{name}</strong> : name}<span style={{ fontWeight: 'normal' }}>®</span>
    </span>
  )
}

export function AboutTab() {
  return (
    <div style={{ maxWidth: '800px' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#333' }}>
        About <TrademarkedName name={APP_NAME} />
      </h2>
      <p style={{ color: '#666', fontStyle: 'italic', marginBottom: '2rem' }}>{APP_DESCRIPTION}</p>

      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: '#0070f3' }}>
          What is <TrademarkedName name={APP_NAME} />?
        </h3>
        <p style={{ lineHeight: '1.6', color: '#555' }}>
          <TrademarkedName name="Statistical PERT" bold /> (<TrademarkedName name="SPERT" />) makes
          statistical modeling accessible to project managers, Scrum Masters, students,
          businesspeople, and others who need to model uncertain outcomes using a lightweight,
          highly accessible approach. PERT stands for Program Evaluation and Review Technique,
          a classic project management method.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: '#0070f3' }}>How It Works</h3>
        <ul style={{ paddingLeft: '2rem', lineHeight: '1.8', color: '#555', listStyleType: 'disc' }}>
          <li>Create a project with your sprint cadence</li>
          <li>Record your sprint history with &quot;done&quot; values</li>
          <li>Enter your remaining backlog size</li>
          <li>Run a Monte Carlo simulation to get probabilistic finish dates</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: '#0070f3' }}>About the Simulation</h3>
        <p style={{ lineHeight: '1.6', color: '#555' }}>
          The forecast runs 50,000 Monte Carlo trials using multiple probability distributions
          (Truncated Normal, Lognormal, Gamma, and Bootstrap). Each trial simulates completing
          the remaining backlog by drawing random velocities for each sprint until the work is done.
          The percentile results show the likelihood of finishing by each date.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: '#0070f3' }}>Your Data &amp; Privacy</h3>
        <ul style={{ paddingLeft: '2rem', lineHeight: '1.8', color: '#555', listStyleType: 'disc' }}>
          <li>Stored locally in your <strong>browser</strong> (not in any cloud database)</li>
          <li><strong>Your data never leaves your device</strong></li>
          <li>No external database servers, no third-party access, no data governance concerns</li>
          <li>Safe for corporate/organizational data - all data stays within your network</li>
          <li><strong>Note:</strong> If you clear your browser cache/data, you will lose all stored projects and sprints unless you&apos;ve exported a backup</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: '#0070f3' }}>Author &amp; Source Code</h3>
        <p style={{ lineHeight: '1.6', color: '#555', marginBottom: '0.5rem' }}>
          Created by <strong>William W. Davis, MSPM, PMP</strong>
        </p>
        <a
          href="https://github.com/famousdavis/spert-web"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: '#0070f3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: '600',
            marginTop: '0.5rem',
          }}
        >
          View Source Code on GitHub
        </a>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: '#0070f3' }}>Version</h3>
        <p style={{ lineHeight: '1.6', color: '#555' }}>v{APP_VERSION}</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: '#0070f3' }}>Trademark</h3>
        <p style={{ lineHeight: '1.6', color: '#555' }}>
          <TrademarkedName name="SPERT" /> and <TrademarkedName name="Statistical PERT" /> are
          registered trademarks with the United States Patent and Trademark Office.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: '#0070f3' }}>License</h3>
        <p style={{ lineHeight: '1.6', color: '#555' }}>
          This software is licensed under the GNU General Public License v3.0 (GPL-3.0).
          You are free to use, modify, and distribute this software under the terms of the
          GPL-3.0 license.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: '#0070f3' }}>No Warranty Disclaimer</h3>
        <p style={{ lineHeight: '1.6', color: '#555' }}>
          THERE IS NO WARRANTY FOR THE PROGRAM, TO THE EXTENT PERMITTED BY APPLICABLE LAW.
          EXCEPT WHEN OTHERWISE STATED IN WRITING THE COPYRIGHT HOLDERS AND/OR OTHER PARTIES
          PROVIDE THE PROGRAM &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED
          OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY
          AND FITNESS FOR A PARTICULAR PURPOSE. THE ENTIRE RISK AS TO THE QUALITY AND
          PERFORMANCE OF THE PROGRAM IS WITH YOU. SHOULD THE PROGRAM PROVE DEFECTIVE, YOU
          ASSUME THE COST OF ALL NECESSARY SERVICING, REPAIR OR CORRECTION.
        </p>
      </section>
    </div>
  )
}
