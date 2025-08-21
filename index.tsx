/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from '@google/genai';
import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { marked } from 'marked';

const THEMES = [
  'Arithmétique',
  'Nombres Complexes',
  'Trigonométrie',
  'Analyse 1',
  'Géométrie Analytique 3D',
];

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function App() {
  const [activeTheme, setActiveTheme] = useState(THEMES[0]);
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleThemeChange = (theme) => {
    setActiveTheme(theme);
    setProblem('');
    setSolution('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!problem.trim()) return;

    setLoading(true);
    setSolution('');
    setError('');

    try {
      const systemInstruction = "Tu es un tuteur expert en mathématiques pour les élèves de Terminale S en France. Fournis des solutions claires et détaillées, étape par étape, en français. Utilise le format Markdown pour la mise en forme. Pour les équations mathématiques, utilise la syntaxe LaTeX (par exemple, `$\\frac{a}{b}$` pour les fractions en ligne, et `$$\\sum_{i=1}^n i = \\frac{n(n+1)}{2}$$` pour les équations en bloc).";
      
      const fullPrompt = `Résous le problème suivant dans le thème "${activeTheme}":\n\n${problem}`;

      const response = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      let currentSolution = '';
      for await (const chunk of response) {
        currentSolution += chunk.text;
        setSolution(currentSolution);
      }
    } catch (err) {
      console.error(err);
      setError("Désolé, une erreur s'est produite lors de la résolution du problème. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header>
        <h1>Maths Solver - Terminale S</h1>
      </header>
      <main>
        <nav className="theme-nav" aria-label="Sélectionner un thème mathématique">
          {THEMES.map((theme) => (
            <button
              key={theme}
              className={`theme-button ${activeTheme === theme ? 'active' : ''}`}
              onClick={() => handleThemeChange(theme)}
              aria-pressed={activeTheme === theme}
            >
              {theme}
            </button>
          ))}
        </nav>

        <section className="solver-container" aria-labelledby="solver-heading">
          <h2 id="solver-heading">{activeTheme}</h2>
          <form onSubmit={handleSubmit}>
            <label htmlFor="problem-input" className="sr-only">Entrez votre problème de mathématiques</label>
            <textarea
              id="problem-input"
              className="problem-input"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Entrez votre problème ici... Par exemple : 'Résoudre l'équation z^2 - 2z + 5 = 0 dans C.'"
              required
              disabled={loading}
              aria-required="true"
            />
            <button type="submit" className="solve-button" disabled={loading}>
              {loading ? 'Résolution en cours...' : 'Résoudre'}
            </button>
          </form>

          <div className="solution-section">
            <h3>Solution :</h3>
            {loading && !solution && <div className="loader" aria-label="Chargement de la solution"></div>}
            {error && <p className="error-message">{error}</p>}
            <div
              className="solution-output"
              dangerouslySetInnerHTML={{ __html: marked.parse(solution) }}
              aria-live="polite"
            ></div>
          </div>
        </section>
      </main>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);