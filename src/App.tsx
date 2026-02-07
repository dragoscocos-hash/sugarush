import { Route, Switch } from 'wouter'
import { Home } from './pages/Home'
import { Log } from './pages/Log'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/log" component={Log} />
        <Route>404 - Not Found</Route>
      </Switch>
    </div>
  )
}

export default App
