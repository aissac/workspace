"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2024-02-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Agents table
    op.create_table(
        'agents',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('api_key', sa.String(64), nullable=False, unique=True, index=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('reputation_score', sa.Float, default=0.0),
    )
    
    # Strategies table
    op.create_table(
        'strategies',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('agent_id', UUID(as_uuid=True), sa.ForeignKey('agents.id'), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('strategy_type', sa.Enum('pine_script', 'python', name='strategy_type'), nullable=False),
        sa.Column('code', sa.Text, nullable=False),
        sa.Column('code_hash', sa.String(64), nullable=False),
        sa.Column('asset', sa.String(20), nullable=False),
        sa.Column('timeframe', sa.String(10), nullable=False),
        sa.Column('status', sa.Enum('pending', 'validated', 'active', 'disabled', 'error', name='strategy_status'), default='pending'),
        sa.Column('validation_errors', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_strategies_agent', 'strategies', ['agent_id'])
    op.create_index('idx_strategies_status', 'strategies', ['status'])
    
    # Backtests table
    op.create_table(
        'backtests',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('agent_id', UUID(as_uuid=True), sa.ForeignKey('agents.id'), nullable=False),
        sa.Column('strategy_id', UUID(as_uuid=True), sa.ForeignKey('strategies.id'), nullable=False),
        sa.Column('status', sa.Enum('queued', 'running', 'completed', 'failed', name='backtest_status'), default='queued'),
        sa.Column('start_date', sa.DateTime, nullable=False),
        sa.Column('end_date', sa.DateTime, nullable=False),
        sa.Column('total_trades', sa.Integer, default=0),
        sa.Column('win_rate', sa.Float),
        sa.Column('profit_factor', sa.Float),
        sa.Column('sharpe_ratio', sa.Float),
        sa.Column('sortino_ratio', sa.Float),
        sa.Column('max_drawdown', sa.Float),
        sa.Column('avg_trade_pnl', sa.Float),
        sa.Column('total_return', sa.Float),
        sa.Column('composite_score', sa.Float),
        sa.Column('leaderboard_rank', sa.Integer),
        sa.Column('trades', JSONB),
        sa.Column('equity_curve', JSONB),
        sa.Column('started_at', sa.DateTime),
        sa.Column('completed_at', sa.DateTime),
        sa.Column('error_message', sa.Text),
    )
    op.create_index('idx_backtests_strategy', 'backtests', ['strategy_id'])
    op.create_index('idx_backtests_status', 'backtests', ['status'])
    op.create_index('idx_backtests_score', 'backtests', [sa.text('composite_score DESC')])
    
    # Leaderboard table
    op.create_table(
        'leaderboard',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('agent_id', UUID(as_uuid=True), sa.ForeignKey('agents.id'), nullable=False),
        sa.Column('strategy_id', UUID(as_uuid=True), sa.ForeignKey('strategies.id'), nullable=False),
        sa.Column('backtest_id', UUID(as_uuid=True), sa.ForeignKey('backtests.id'), nullable=False),
        sa.Column('timeframe', sa.String(20), nullable=False),
        sa.Column('rank', sa.Integer, nullable=False),
        sa.Column('previous_rank', sa.Integer),
        sa.Column('composite_score', sa.Float, nullable=False),
        sa.Column('sharpe_ratio', sa.Float, nullable=False),
        sa.Column('profit_factor', sa.Float, nullable=False),
        sa.Column('calculated_at', sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index('idx_leaderboard_timeframe_rank', 'leaderboard', ['timeframe', 'rank'])
    op.create_index('idx_leaderboard_agent', 'leaderboard', ['agent_id', 'timeframe'])
    
    # Audit log table
    op.create_table(
        'audit_log',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('agent_id', UUID(as_uuid=True), sa.ForeignKey('agents.id')),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', UUID(as_uuid=True), nullable=False),
        sa.Column('details', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('ip_address', sa.String(45)),
    )


def downgrade() -> None:
    op.drop_table('audit_log')
    op.drop_table('leaderboard')
    op.drop_table('backtests')
    op.drop_table('strategies')
    op.drop_table('agents')