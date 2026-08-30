import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import NavDock from './NavDock'

describe('NavDock', () => {
  it('renders all six nav items with their labels', () => {
    render(<NavDock activePage="home" onNavigate={vi.fn()} />)
    expect(screen.getByRole('button', { name: '首頁' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '統計' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '商店' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '寵物' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '技能樹' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '設定' })).toBeInTheDocument()
  })

  it('marks the active page button with aria-current, and no other button', () => {
    render(<NavDock activePage="shop" onNavigate={vi.fn()} />)
    expect(screen.getByRole('button', { name: '商店' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: '首頁' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: '統計' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: '寵物' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: '技能樹' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: '設定' })).not.toHaveAttribute('aria-current')
  })

  it('calls onNavigate with the page id when a nav item is clicked', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<NavDock activePage="home" onNavigate={onNavigate} />)

    await user.click(screen.getByRole('button', { name: '寵物' }))
    expect(onNavigate).toHaveBeenCalledWith('pet')

    await user.click(screen.getByRole('button', { name: '技能樹' }))
    expect(onNavigate).toHaveBeenCalledWith('skillTree')

    await user.click(screen.getByRole('button', { name: '設定' }))
    expect(onNavigate).toHaveBeenCalledWith('settings')
  })
})
