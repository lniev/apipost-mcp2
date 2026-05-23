/**
 * ApiPost MCP 工作空间管理模块
 */

import {
    APIPOST_DEFAULT_TEAM_NAME,
    APIPOST_DEFAULT_PROJECT_NAME,
    APIPOST_SECURITY_MODE,
    logWithTime
} from '../config/index.js';
import { getTeamList, getProjectList } from '../api-client/index.js';
import type { Workspace, Team, Project } from '../types/index.js';

// ============ 工作空间状态 ============
let currentWorkspace: Workspace | null = null;

export function getCurrentWorkspace(): Workspace | null {
    return currentWorkspace;
}

export function setCurrentWorkspace(workspace: Workspace): void {
    currentWorkspace = workspace;
}

export function isWorkspaceInitialized(): boolean {
    return currentWorkspace !== null;
}

// ============ 初始化工作空间 ============
export async function initWorkspace(startTime?: number): Promise<Workspace> {
    try {
        logWithTime('🔄 初始化工作空间...', startTime);

        // 获取团队列表
        const teams = await getTeamList();

        if (!teams || teams.length === 0) {
            throw new Error('未找到任何团队，请检查 API Token 权限');
        }

        // 选择团队：优先使用指定的团队名称，否则使用第一个
        let selectedTeam = teams[0];
        if (APIPOST_DEFAULT_TEAM_NAME) {
            const targetTeam = teams.find((team: Team) => team.name === APIPOST_DEFAULT_TEAM_NAME);
            if (targetTeam) {
                selectedTeam = targetTeam;
                logWithTime(`🎯 使用指定团队: ${APIPOST_DEFAULT_TEAM_NAME}`, startTime);
            } else {
                logWithTime(`⚠️ 未找到指定团队 "${APIPOST_DEFAULT_TEAM_NAME}"，使用默认团队`, startTime);
            }
        }

        logWithTime(`📋 选中团队: ${selectedTeam.name} (${selectedTeam.team_id})`, startTime);

        // 获取项目列表
        const projects = await getProjectList(selectedTeam.team_id);

        if (!projects || projects.length === 0) {
            throw new Error(`团队 "${selectedTeam.name}" 下未找到任何项目`);
        }

        // 选择项目：优先使用指定的项目名称，否则使用第一个
        let selectedProject = projects[0];
        if (APIPOST_DEFAULT_PROJECT_NAME) {
            const targetProject = projects.find((project: Project) => project.name === APIPOST_DEFAULT_PROJECT_NAME);
            if (targetProject) {
                selectedProject = targetProject;
                logWithTime(`🎯 使用指定项目: ${APIPOST_DEFAULT_PROJECT_NAME}`, startTime);
            } else {
                logWithTime(`⚠️ 未找到指定项目 "${APIPOST_DEFAULT_PROJECT_NAME}"，使用默认项目`, startTime);
            }
        }

        logWithTime(`
✅ 选中项目
项目名称: ${selectedProject.name}
项目ID: ${selectedProject.project_id}`, startTime);

        currentWorkspace = {
            teamId: selectedTeam.team_id,
            teamName: selectedTeam.name,
            projectId: selectedProject.project_id,
            projectName: selectedProject.name
        };

        logWithTime(`✨ 工作空间初始化完成 (安全模式: ${APIPOST_SECURITY_MODE})`, startTime);
        return currentWorkspace;
    } catch (error) {
        logWithTime('❌ 工作空间初始化失败: ' + error, startTime);
        throw error;
    }
}

// ============ 切换工作空间 ============
export async function switchWorkspace(
    teamId?: string,
    projectId?: string,
    teamName?: string,
    projectName?: string
): Promise<Workspace> {
    // 如果提供了团队名称，先查找团队
    if (teamName) {
        const teams = await getTeamList();
        const targetTeam = teams.find((t: Team) => t.name === teamName);
        if (!targetTeam) {
            throw new Error(`未找到团队: ${teamName}`);
        }
        teamId = targetTeam.team_id;
    }

    // 如果提供了项目名称，先查找项目
    if (projectName && teamId) {
        const projects = await getProjectList(teamId);
        const targetProject = projects.find((p: Project) => p.name === projectName);
        if (!targetProject) {
            throw new Error(`未找到项目: ${projectName}`);
        }
        projectId = targetProject.project_id;
    }

    if (!teamId || !projectId) {
        throw new Error('切换工作空间需要提供 teamId 和 projectId，或 teamName 和 projectName');
    }

    // 验证团队存在
    const teams = await getTeamList();
    const selectedTeam = teams.find((t: Team) => t.team_id === teamId);
    if (!selectedTeam) {
        throw new Error(`未找到团队 ID: ${teamId}`);
    }

    // 验证项目存在
    const projects = await getProjectList(teamId);
    const selectedProject = projects.find((p: Project) => p.project_id === projectId);
    if (!selectedProject) {
        throw new Error(`未找到项目 ID: ${projectId}`);
    }

    currentWorkspace = {
        teamId: selectedTeam.team_id,
        teamName: selectedTeam.name,
        projectId: selectedProject.project_id,
        projectName: selectedProject.name
    };

    return currentWorkspace;
}
