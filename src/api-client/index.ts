/**
 * ApiPost MCP API 客户端模块
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { APIPOST_HOST, APIPOST_TOKEN } from '../config/index.js';
import type { ApiPostApiResponse } from '../types/index.js';

// ============ API 客户端实例 ============
let apiClient: AxiosInstance | null = null;

export function getApiClient(): AxiosInstance {
    if (!apiClient) {
        apiClient = axios.create({
            baseURL: APIPOST_HOST,
            headers: {
                'Api-Token': APIPOST_TOKEN,
                'Content-Type': 'application/json'
            }
        });
    }
    return apiClient;
}

// ============ API 响应包装器 ============
export async function apiRequest<T>(
    method: 'get' | 'post',
    url: string,
    data?: unknown,
    params?: Record<string, unknown>
): Promise<T> {
    const client = getApiClient();
    let response: AxiosResponse<ApiPostApiResponse<T>>;

    if (method === 'get') {
        response = await client.get(url, { params });
    } else {
        response = await client.post(url, data);
    }

    if (response.data.code !== 0) {
        throw new Error(`API 请求失败: ${response.data.msg || response.data.message || '未知错误'}`);
    }

    return response.data.data;
}

// ============ 团队 API ============
export async function getTeamList(): Promise<{ team_id: string; name: string }[]> {
    return apiRequest('get', '/open/team/list');
}

// ============ 项目 API ============
export async function getProjectList(teamId: string): Promise<{ project_id: string; name: string }[]> {
    return apiRequest('get', '/open/project/list', undefined, { team_id: teamId, action: 0 });
}

// ============ API 列表 API ============
export async function getApiList(projectId: string): Promise<{ list: unknown[] }> {
    return apiRequest('get', '/open/apis/list', undefined, { project_id: projectId });
}

// ============ API 详情 API ============
export async function getApiDetails(projectId: string, targetIds: string[]): Promise<{ list: unknown[] }> {
    return apiRequest('post', '/open/apis/details', { project_id: projectId, target_ids: targetIds });
}

// ============ 创建目录 API ============
export async function createFolder(
    projectId: string,
    name: string,
    parentId: string,
    description?: string
): Promise<unknown> {
    return Promise.reject(new Error("创建目录 API 官方还未支持"));

}

// ============ 创建 API ============
export async function createApi(apiData: Record<string, unknown>): Promise<unknown> {
    return apiRequest('post', '/open/apis/create', apiData);
}

// ============ 更新 API ============
export async function updateApi(apiData: Record<string, unknown>): Promise<unknown> {
    return apiRequest('post', '/open/apis/update', apiData);
}


// ============ 删除 API ============
export async function deleteApis(projectId: string, apiIds: string[]): Promise<unknown> {
    return apiRequest('post', '/open/apis/delete', {
        project_id: projectId,
        api_ids: apiIds
    });
}
