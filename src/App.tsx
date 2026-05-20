/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import SnakeGame from './components/SnakeGame';

export default function App() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-amber-50 via-white to-sky-50 text-slate-900">
      <SnakeGame />
    </div>
  );
}
